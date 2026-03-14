export interface MCPServerDescriptor {
  id: string;
  name: string;
  version: string;
  description: string;
  capabilities: string[];
  repository?: string;
  package?: {
    type: 'npm' | 'uvx' | 'docker';
    name: string;
  };
  official: boolean;
}

export interface CapabilityQuery {
  capability?: string;
  search?: string;
  official?: boolean;
}
