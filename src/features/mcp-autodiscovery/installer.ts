const OFFICIAL_SERVERS = [
  '@modelcontextprotocol/server-memory',
  '@modelcontextprotocol/server-filesystem',
  'mcp-server-fetch',
  'mcp-server-git'
];

interface PackageInfo {
  type: 'npm' | 'uvx' | 'docker';
  name: string;
}

export class MCPInstaller {
  isOfficialServer(packageName: string): boolean {
    return OFFICIAL_SERVERS.includes(packageName);
  }

  getInstallCommand(pkg: PackageInfo): string {
    if (pkg.type === 'npm') {
      return `npm install -g ${pkg.name}`;
    }
    if (pkg.type === 'uvx') {
      return `uvx ${pkg.name}`;
    }
    return `docker pull ${pkg.name}`;
  }
}
