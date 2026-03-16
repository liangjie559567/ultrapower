// Clawdbot can manage PSM sessions
interface ClawdbotPSMIntegration {
  // List sessions via Clawdbot UI
  listSessions(): Promise<Session[]>;

  // Create session from Clawdbot
  createSession(options: SessionOptions): Promise<Session>;

  // Attach to session in new terminal
  attachSession(sessionId: string): Promise<void>;

  // Session status in Clawdbot dashboard
  getSessionStatus(sessionId: string): Promise<SessionStatus>;
}
