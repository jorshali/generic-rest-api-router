import { getReasonPhrase } from 'http-status-codes';

export class ApiError extends Error {
    constructor(public statusCode: number, message?: string) {
        super(message || getReasonPhrase(statusCode));
    }
}
