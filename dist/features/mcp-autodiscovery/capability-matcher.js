import { MCPRegistryClient } from './registry-client.js';
export class CapabilityMatcher {
    registryClient;
    constructor() {
        this.registryClient = new MCPRegistryClient();
    }
    async findMatches(requirement) {
        const allServers = await this.registryClient.listServers();
        const matches = [];
        for (const server of allServers) {
            if (!server.capabilities || server.capabilities.length === 0)
                continue;
            const matchedCaps = requirement.requiredCapabilities.filter(cap => server.capabilities.some(sc => sc.includes(cap) || cap.includes(sc)));
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
//# sourceMappingURL=capability-matcher.js.map