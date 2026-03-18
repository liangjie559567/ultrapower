export class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ValidationError';
    }
}
export class InputError extends Error {
    constructor(message) {
        super(message);
        this.name = 'InputError';
    }
}
//# sourceMappingURL=types.js.map