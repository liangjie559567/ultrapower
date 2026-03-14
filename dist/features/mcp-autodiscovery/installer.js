const OFFICIAL_SERVERS = [
    '@modelcontextprotocol/server-memory',
    '@modelcontextprotocol/server-filesystem',
    'mcp-server-fetch',
    'mcp-server-git'
];
export class MCPInstaller {
    isOfficialServer(packageName) {
        return OFFICIAL_SERVERS.includes(packageName);
    }
    getInstallCommand(pkg) {
        if (pkg.type === 'npm') {
            return `npm install -g ${pkg.name}`;
        }
        if (pkg.type === 'uvx') {
            return `uvx ${pkg.name}`;
        }
        return `docker pull ${pkg.name}`;
    }
}
//# sourceMappingURL=installer.js.map