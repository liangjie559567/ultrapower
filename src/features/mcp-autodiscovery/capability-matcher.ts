import { MCPRegistryClient } from './registry-client.js';
import type { MCPServerDescriptor } from './types.js';

interface TaskRequirement {
  taskDescription: string;
  requiredCapabilities: string[];
}

interface Match {
  server: MCPServerDescriptor;
  confidence: number;
  matchedCapabilities: string[];
}

export class CapabilityMatcher {
  private registryClient: MCPRegistryClient;

  constructor() {
    this.registryClient = new MCPRegistryClient();
  }

  async findMatches(requirement: TaskRequirement): Promise<Match[]> {
    const allServers = await this.registryClient.listServers();
    const matches: Match[] = [];

    for (const server of allServers) {
      if (!server.capabilities || server.capabilities.length === 0) continue;

      const matchedCaps = requirement.requiredCapabilities.filter(
        cap => server.capabilities.some(sc => sc.includes(cap) || cap.includes(sc))
      );

      if (matchedCaps.length > 0) {
        const confidence = matchedCaps.length / requirement.requiredCapabilities.length;
        matches.push({
          server,
          confidence,
          matchedCapabilities: matchedCaps
        });
      }
    }

    return matches.sort((a, b) => b.confidence - a.confidence);
  }
}
