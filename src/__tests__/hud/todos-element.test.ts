import { describe, it, expect } from 'vitest';
import { renderTodosWithCurrent } from '../../hud/elements/todos.js';

describe('Todos Element', () => {
  it('renders todo count', () => {
    const todos = [
      { status: 'completed', subject: 'Task 1' },
      { status: 'in_progress', subject: 'Task 2' },
      { status: 'pending', subject: 'Task 3' }
    ];
    const result = renderTodosWithCurrent(todos);
    expect(result).toContain('1');
    expect(result).toContain('3');
  });

  it('returns null for empty todos', () => {
    expect(renderTodosWithCurrent([])).toBeNull();
  });
});
