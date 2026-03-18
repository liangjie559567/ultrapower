import { InputError, ValidationError } from './types.js';
export function selectTechStack(requirement, platform) {
    if (!requirement?.trim()) {
        throw new InputError('Requirement cannot be empty');
    }
    if (requirement.length > 1000) {
        throw new ValidationError('Requirement too long (max 1000 chars)');
    }
    const req = requirement.toLowerCase();
    const result = { frontend: [], backend: [], database: [] };
    // Frontend
    if (platform === 'web') {
        result.frontend = req.includes('react') ? ['React', 'TypeScript'] : ['Vue', 'TypeScript'];
    }
    else if (platform === 'mobile') {
        result.frontend = ['React Native', 'TypeScript'];
    }
    // Backend
    if (req.includes('node') || req.includes('javascript')) {
        result.backend = ['Node.js', 'Express', 'TypeScript'];
    }
    else if (req.includes('python')) {
        result.backend = ['Python', 'FastAPI'];
    }
    else {
        result.backend = ['Node.js', 'Express', 'TypeScript'];
    }
    // Database
    if (req.includes('nosql') || req.includes('mongo')) {
        result.database = ['MongoDB'];
    }
    else if (req.includes('postgres')) {
        result.database = ['PostgreSQL'];
    }
    else {
        result.database = ['PostgreSQL'];
    }
    return result;
}
//# sourceMappingURL=tech-selector.js.map