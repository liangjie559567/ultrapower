/**
 * Shared State Management for Cross-Tool Interoperability
 *
 * Manages shared state files at .omc/state/interop/ for communication
 * between OMC (Claude Code) and OMX (Codex CLI).
 *
 * Uses atomic writes for safety and supports task/message passing.
 */
import { join } from 'path';
import { existsSync, mkdirSync, readFileSync, readdirSync, unlinkSync } from 'fs';
import { atomicWriteJsonSync } from '../lib/atomic-write.js';
/**
 * Get the interop directory path for a worktree
 */
export function getInteropDir(cwd) {
    return join(cwd, '.omc', 'state', 'interop');
}
/**
 * Initialize an interop session
 * Creates the interop directory and session config
 */
export function initInteropSession(sessionId, omcCwd, omxCwd) {
    const interopDir = getInteropDir(omcCwd);
    // Ensure directory exists
    if (!existsSync(interopDir)) {
        mkdirSync(interopDir, { recursive: true });
    }
    const config = {
        sessionId,
        createdAt: new Date().toISOString(),
        omcCwd,
        omxCwd,
        status: 'active',
    };
    const configPath = join(interopDir, 'config.json');
    atomicWriteJsonSync(configPath, config);
    return config;
}
/**
 * Read interop configuration
 */
export function readInteropConfig(cwd) {
    const configPath = join(getInteropDir(cwd), 'config.json');
    if (!existsSync(configPath)) {
        return null;
    }
    try {
        const content = readFileSync(configPath, 'utf-8');
        return JSON.parse(content);
    }
    catch {
        return null;
    }
}
/**
 * Add a shared task for cross-tool communication
 */
export function addSharedTask(cwd, task) {
    const interopDir = getInteropDir(cwd);
    const fullTask = {
        ...task,
        id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        createdAt: new Date().toISOString(),
        status: 'pending',
    };
    const taskPath = join(interopDir, 'tasks', `${fullTask.id}.json`);
    // Ensure tasks directory exists
    const tasksDir = join(interopDir, 'tasks');
    if (!existsSync(tasksDir)) {
        mkdirSync(tasksDir, { recursive: true });
    }
    atomicWriteJsonSync(taskPath, fullTask);
    return fullTask;
}
/**
 * Read all shared tasks
 */
export function readSharedTasks(cwd, filter) {
    const tasksDir = join(getInteropDir(cwd), 'tasks');
    if (!existsSync(tasksDir)) {
        return [];
    }
    const files = readdirSync(tasksDir).filter(f => f.endsWith('.json'));
    const tasks = [];
    for (const file of files) {
        try {
            const content = readFileSync(join(tasksDir, file), 'utf-8');
            const task = JSON.parse(content);
            // Apply filters
            if (filter?.source && task.source !== filter.source)
                continue;
            if (filter?.target && task.target !== filter.target)
                continue;
            if (filter?.status && task.status !== filter.status)
                continue;
            tasks.push(task);
        }
        catch {
            // Skip invalid task files
        }
    }
    // Sort by creation time (newest first)
    return tasks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
/**
 * Update a shared task
 */
export function updateSharedTask(cwd, taskId, updates) {
    const taskPath = join(getInteropDir(cwd), 'tasks', `${taskId}.json`);
    if (!existsSync(taskPath)) {
        return null;
    }
    try {
        const content = readFileSync(taskPath, 'utf-8');
        const task = JSON.parse(content);
        const updatedTask = {
            ...task,
            ...updates,
        };
        // Set completedAt if status changed to completed/failed
        if ((updates.status === 'completed' || updates.status === 'failed') &&
            !updatedTask.completedAt) {
            updatedTask.completedAt = new Date().toISOString();
        }
        atomicWriteJsonSync(taskPath, updatedTask);
        return updatedTask;
    }
    catch {
        return null;
    }
}
/**
 * Add a shared message for cross-tool communication
 */
export function addSharedMessage(cwd, message) {
    const interopDir = getInteropDir(cwd);
    const fullMessage = {
        ...message,
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        timestamp: new Date().toISOString(),
        read: false,
    };
    const messagePath = join(interopDir, 'messages', `${fullMessage.id}.json`);
    // Ensure messages directory exists
    const messagesDir = join(interopDir, 'messages');
    if (!existsSync(messagesDir)) {
        mkdirSync(messagesDir, { recursive: true });
    }
    atomicWriteJsonSync(messagePath, fullMessage);
    return fullMessage;
}
/**
 * Read shared messages
 */
export function readSharedMessages(cwd, filter) {
    const messagesDir = join(getInteropDir(cwd), 'messages');
    if (!existsSync(messagesDir)) {
        return [];
    }
    const files = readdirSync(messagesDir).filter(f => f.endsWith('.json'));
    const messages = [];
    for (const file of files) {
        try {
            const content = readFileSync(join(messagesDir, file), 'utf-8');
            const message = JSON.parse(content);
            // Apply filters
            if (filter?.source && message.source !== filter.source)
                continue;
            if (filter?.target && message.target !== filter.target)
                continue;
            if (filter?.unreadOnly && message.read)
                continue;
            messages.push(message);
        }
        catch {
            // Skip invalid message files
        }
    }
    // Sort by timestamp (newest first)
    return messages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}
/**
 * Mark a message as read
 */
export function markMessageAsRead(cwd, messageId) {
    const messagePath = join(getInteropDir(cwd), 'messages', `${messageId}.json`);
    if (!existsSync(messagePath)) {
        return false;
    }
    try {
        const content = readFileSync(messagePath, 'utf-8');
        const message = JSON.parse(content);
        message.read = true;
        atomicWriteJsonSync(messagePath, message);
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Clean up interop session
 * Removes all tasks and messages for a session
 */
export function cleanupInterop(cwd, options) {
    const interopDir = getInteropDir(cwd);
    let tasksDeleted = 0;
    let messagesDeleted = 0;
    const cutoffTime = options?.olderThan
        ? Date.now() - options.olderThan
        : 0;
    // Clean up tasks
    if (!options?.keepTasks) {
        const tasksDir = join(interopDir, 'tasks');
        if (existsSync(tasksDir)) {
            const files = readdirSync(tasksDir).filter(f => f.endsWith('.json'));
            for (const file of files) {
                try {
                    const filePath = join(tasksDir, file);
                    if (options?.olderThan) {
                        const content = readFileSync(filePath, 'utf-8');
                        const task = JSON.parse(content);
                        const taskTime = new Date(task.createdAt).getTime();
                        if (taskTime < cutoffTime) {
                            unlinkSync(filePath);
                            tasksDeleted++;
                        }
                    }
                    else {
                        unlinkSync(filePath);
                        tasksDeleted++;
                    }
                }
                catch {
                    // Skip files that can't be deleted
                }
            }
        }
    }
    // Clean up messages
    if (!options?.keepMessages) {
        const messagesDir = join(interopDir, 'messages');
        if (existsSync(messagesDir)) {
            const files = readdirSync(messagesDir).filter(f => f.endsWith('.json'));
            for (const file of files) {
                try {
                    const filePath = join(messagesDir, file);
                    if (options?.olderThan) {
                        const content = readFileSync(filePath, 'utf-8');
                        const message = JSON.parse(content);
                        const messageTime = new Date(message.timestamp).getTime();
                        if (messageTime < cutoffTime) {
                            unlinkSync(filePath);
                            messagesDeleted++;
                        }
                    }
                    else {
                        unlinkSync(filePath);
                        messagesDeleted++;
                    }
                }
                catch {
                    // Skip files that can't be deleted
                }
            }
        }
    }
    return { tasksDeleted, messagesDeleted };
}
//# sourceMappingURL=shared-state.js.map