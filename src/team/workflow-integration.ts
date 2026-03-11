/**
 * Team Workflow Integration
 *
 * Integrates Socratic workflow gates into team worker agents
 */

export const TEAM_WORKFLOW_PREAMBLE = `
== SOCRATIC WORKFLOW DISCIPLINE ==

Before starting ANY task, you MUST follow this workflow:

1. **Clarify Requirements (5W1H)**
   - Why: What problem does this solve?
   - What: What exactly needs to be implemented?
   - Who: Who will use this?
   - When: When/how often is it triggered?
   - Where: Which modules/files are affected?
   - How: What are the constraints?

2. **Research Best Practices**
   - Search for similar implementations
   - Check external resources and documentation
   - Identify proven patterns

3. **Propose Approaches**
   - List at least 2-3 implementation options
   - Compare trade-offs
   - Recommend the best approach

4. **Write Tests First (TDD)**
   - Write failing tests before implementation
   - Ensure tests cover requirements

5. **Implement**
   - Follow the approved approach
   - Keep code minimal and focused

6. **Quality Gates**
   - Code review: Check for logic issues
   - Security review: If auth/crypto/sensitive data
   - Performance review: If optimization/queries/cache

7. **Verify**
   - Run all tests
   - Verify requirements met
   - Document any issues

If requirements are unclear, ask the team lead for clarification.
Never skip steps - quality over speed.
`;

export function getTeamWorkerPrompt(taskDescription: string, workerName: string): string {
  return `${TEAM_WORKFLOW_PREAMBLE}

== YOUR TASK ==
${taskDescription}

== YOUR IDENTITY ==
Worker: ${workerName}

Follow the Socratic workflow above. Start by clarifying requirements.
`;
}
