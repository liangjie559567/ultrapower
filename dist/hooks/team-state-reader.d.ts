export interface TeamStagedState {
    active?: boolean;
    stage?: string;
    current_stage?: string;
    currentStage?: string;
    status?: string;
    session_id?: string;
    sessionId?: string;
    team_name?: string;
    teamName?: string;
    started_at?: string;
    startedAt?: string;
    task?: string;
    cancelled?: boolean;
    canceled?: boolean;
    completed?: boolean;
    terminal?: boolean;
}
export declare function readTeamStagedState(directory: string, sessionId?: string): Promise<TeamStagedState | null>;
export declare function readTeamStagedStateSync(directory: string, sessionId?: string): TeamStagedState | null;
export declare function getTeamStage(state: TeamStagedState): string;
export declare function isTeamStateTerminal(state: TeamStagedState): boolean;
export declare function getTeamStagePrompt(stage: string): string;
//# sourceMappingURL=team-state-reader.d.ts.map