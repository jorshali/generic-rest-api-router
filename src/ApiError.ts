import { getReasonPhrase } from 'http-status-codes';

/**
 * Error that allows the response to be customized.  The statusCode indicates
 * the HTTP status code that will be sent back in a response.  A message can
 * be provided to be included in the response body.  If a message is not provided,
 * the standard HTTP status code reason phrase will be sent in the body.
 */
export class ApiError extends Error {
    /**
     * Create an ApiError instance with an HTTP statusCode and message.
     *
     * @param statusCode the HTTP status code to be sent back in the response
     * @param message (optional) the message to be included in the response body
     */
    constructor(public statusCode: number, message?: string) {
        super(message || getReasonPhrase(statusCode));
    }
}
