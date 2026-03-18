import { InputError, ValidationError } from './types.js';
export function analyzeLibrary(libraryName, projectLicense = 'MIT') {
    if (!libraryName?.trim()) {
        throw new InputError('Library name cannot be empty');
    }
    if (libraryName.length > 200) {
        throw new ValidationError('Library name too long (max 200 chars)');
    }
    const name = libraryName.toLowerCase();
    // 简化的许可证分析
    let license = 'MIT';
    let compatible = true;
    let risk = 'low';
    if (name.includes('gpl')) {
        license = 'GPL';
        compatible = projectLicense === 'GPL';
        risk = 'high';
    }
    else if (name.includes('apache')) {
        license = 'Apache-2.0';
        risk = 'low';
    }
    return { name: libraryName, license, compatible, risk };
}
//# sourceMappingURL=opensource-analyzer.js.map