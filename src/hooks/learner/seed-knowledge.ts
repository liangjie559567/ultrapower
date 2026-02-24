/**
 * seed-knowledge.ts — 种子知识初始化器
 *
 * 从 Axiom seed_knowledge.py 移植。从 knowledge_base.md 加载种子知识条目。
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import type { KnowledgeEntry } from './harvester.js';
import { KnowledgeHarvester } from './harvester.js';

export interface SeedResult {
  seeded: number;
  skipped: number;
  entries: KnowledgeEntry[];
}

export class SeedKnowledge {
  private readonly harvester: KnowledgeHarvester;
  private readonly knowledgeBaseFile: string;

  constructor(baseDir?: string) {
    const base = baseDir ?? process.cwd();
    this.harvester = new KnowledgeHarvester(base);
    this.knowledgeBaseFile = path.join(
      base,
      '.omc',
      'axiom',
      'evolution',
      'knowledge_base.md'
    );
  }

  async seed(force = false): Promise<SeedResult> {
    const existing = await this.harvester.listEntries();
    if (existing.length > 0 && !force) {
      return { seeded: 0, skipped: existing.length, entries: [] };
    }

    const seedItems = await this.loadSeedItems();
    const entries: KnowledgeEntry[] = [];

    for (const item of seedItems) {
      const entry = await this.harvester.harvest(
        'user_feedback',
        item.title,
        item.content,
        { confidence: item.confidence }
      );
      entries.push(entry);
    }

    return { seeded: entries.length, skipped: 0, entries };
  }

  private async loadSeedItems(): Promise<
    Array<{ title: string; content: string; category: string; confidence: number }>
  > {
    let text: string;
    try {
      text = await fs.readFile(this.knowledgeBaseFile, 'utf-8');
    } catch {
      return this.getBuiltinSeeds();
    }

    const items: Array<{
      title: string;
      content: string;
      category: string;
      confidence: number;
    }> = [];

    // 解析 knowledge_base.md 中的条目（### 标题格式）
    const sections = text.split(/^### /m).filter(Boolean);
    for (const section of sections) {
      const lines = section.split('\n');
      const title = lines[0]?.trim() ?? '';
      if (!title) continue;

      const content = lines.slice(1).join('\n').trim();
      const categoryMatch = content.match(/\*\*Category:\*\*\s*(.+)/);
      const confidenceMatch = content.match(/\*\*Confidence:\*\*\s*([\d.]+)/);

      items.push({
        title,
        content,
        category: categoryMatch?.[1]?.trim() ?? 'general',
        confidence: parseFloat(confidenceMatch?.[1] ?? '0.85') || 0.85,
      });
    }

    return items.length > 0 ? items : this.getBuiltinSeeds();
  }

  private getBuiltinSeeds(): Array<{
    title: string;
    content: string;
    category: string;
    confidence: number;
  }> {
    // 对齐 Python seed_knowledge.py：10 Flutter + 5 Dart + 5 工作流/工程种子
    return [
      // Flutter seeds
      {
        title: 'Flutter StatelessWidget vs StatefulWidget',
        content:
          'Use StatelessWidget when UI depends only on constructor params. Use StatefulWidget when UI needs to change over time. Prefer StatelessWidget for performance.',
        category: 'flutter',
        confidence: 0.95,
      },
      {
        title: 'Flutter BLoC pattern for state management',
        content:
          'BLoC separates business logic from UI. Use Cubit for simple state, BLoC for complex event-driven state. Always close streams in dispose().',
        category: 'flutter',
        confidence: 0.9,
      },
      {
        title: 'Flutter widget testing best practices',
        content:
          'Use WidgetTester.pumpWidget() to build widgets. Use find.byType() and find.text() for locating widgets. Always pump after async operations.',
        category: 'flutter',
        confidence: 0.9,
      },
      {
        title: 'Flutter Navigator 2.0 routing',
        content:
          'Use GoRouter or auto_route for declarative routing. Define routes as constants. Use pushNamed for named routes to avoid typos.',
        category: 'flutter',
        confidence: 0.85,
      },
      {
        title: 'Flutter performance: const constructors',
        content:
          'Mark widgets as const when possible to avoid unnecessary rebuilds. Use const for immutable widgets in build methods.',
        category: 'flutter',
        confidence: 0.95,
      },
      {
        title: 'Flutter dependency injection with get_it',
        content:
          'Register services in main() before runApp(). Use GetIt.instance.get<T>() or sl<T>() shorthand. Register singletons for services, factories for ViewModels.',
        category: 'flutter',
        confidence: 0.85,
      },
      {
        title: 'Flutter error handling with Either',
        content:
          'Use dartz Either<Failure, Success> for functional error handling. Define Failure classes for each error type. Map errors at repository layer.',
        category: 'flutter',
        confidence: 0.85,
      },
      {
        title: 'Flutter responsive layout with LayoutBuilder',
        content:
          'Use LayoutBuilder to get parent constraints. Use MediaQuery for screen dimensions. Define breakpoints as constants (mobile < 600, tablet < 1200).',
        category: 'flutter',
        confidence: 0.85,
      },
      {
        title: 'Flutter animation with AnimationController',
        content:
          'Always dispose AnimationController in dispose(). Use CurvedAnimation for easing. Prefer implicit animations (AnimatedContainer) for simple cases.',
        category: 'flutter',
        confidence: 0.85,
      },
      {
        title: 'Flutter platform channels for native code',
        content:
          'Use MethodChannel for one-time calls, EventChannel for streams. Define channel names as constants. Handle PlatformException in try/catch.',
        category: 'flutter',
        confidence: 0.8,
      },
      // Dart seeds
      {
        title: 'Dart null safety best practices',
        content:
          'Use ? for nullable types, ! only when null is impossible. Prefer ?? for defaults, ??= for lazy initialization. Use late for deferred initialization.',
        category: 'dart',
        confidence: 0.95,
      },
      {
        title: 'Dart async/await patterns',
        content:
          'Always await Futures. Use Future.wait() for parallel operations. Prefer async/await over .then() chains. Handle errors with try/catch around await.',
        category: 'dart',
        confidence: 0.95,
      },
      {
        title: 'Dart extension methods',
        content:
          'Use extensions to add methods to existing types without subclassing. Name extensions descriptively. Keep extensions in separate files by type.',
        category: 'dart',
        confidence: 0.85,
      },
      {
        title: 'Dart sealed classes for exhaustive matching',
        content:
          'Use sealed classes (Dart 3+) for exhaustive switch expressions. Compiler enforces all cases are handled. Prefer over abstract classes for ADTs.',
        category: 'dart',
        confidence: 0.85,
      },
      {
        title: 'Dart collection operations',
        content:
          'Use .map(), .where(), .fold() for functional collection operations. Use spread operator (...) for combining lists. Prefer List.generate() over loops for initialization.',
        category: 'dart',
        confidence: 0.9,
      },
      // Workflow/engineering seeds
      {
        title: 'TDD red-green-refactor cycle',
        content:
          'Write failing test first (red). Write minimal code to pass (green). Refactor while keeping tests green. Commit after each green phase.',
        category: 'workflow',
        confidence: 0.95,
      },
      {
        title: 'Git atomic commits',
        content:
          'Each commit should represent one logical change. Use conventional commits format: type(scope): description. Commit after each passing test.',
        category: 'workflow',
        confidence: 0.9,
      },
      {
        title: 'YAGNI principle in feature development',
        content:
          'You Aren\'t Gonna Need It. Only implement what is currently required. Avoid speculative generality. Remove unused code immediately.',
        category: 'engineering',
        confidence: 0.9,
      },
      {
        title: 'Clean architecture layer separation',
        content:
          'Domain layer has no dependencies. Data layer implements domain interfaces. Presentation layer depends on domain only. Dependencies point inward.',
        category: 'engineering',
        confidence: 0.9,
      },
      {
        title: 'Error handling at system boundaries',
        content:
          'Validate at system boundaries (user input, external APIs). Trust internal code. Use typed errors. Log errors with context. Never swallow exceptions silently.',
        category: 'engineering',
        confidence: 0.9,
      },
    ];
  }
}
