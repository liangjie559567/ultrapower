const PACKAGE_NAME_REGEX = /^[@a-z0-9-_./]+$/i;
export class ConfigInjector {
    generateConfig(server) {
        if (!server.package) {
            throw new Error('Package info required');
        }
        if (!PACKAGE_NAME_REGEX.test(server.package.name)) {
            throw new Error(`Invalid package name: ${server.package.name}`);
        }
        if (server.package.type === 'uvx') {
            return {
                command: 'uvx',
                args: [server.package.name]
            };
        }
        if (server.package.type === 'npm') {
            return {
                command: 'node',
                args: [server.package.name]
            };
        }
        return {
            command: 'docker',
            args: ['run', server.package.name]
        };
    }
}
//# sourceMappingURL=config-injector.js.map