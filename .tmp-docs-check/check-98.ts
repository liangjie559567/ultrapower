// Plugin interface for custom workflows
interface PSMPlugin {
  name: string;

  // Called before session creation
  beforeCreate?(context: SessionContext): Promise<void>;

  // Called after session creation
  afterCreate?(session: Session): Promise<void>;

  // Custom cleanup logic
  shouldCleanup?(session: Session): Promise<boolean>;

  // Custom context generation
  generateContext?(session: Session): Promise<string>;
}
