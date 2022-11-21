import { StatusCodes, getReasonPhrase } from 'http-status-codes';
import * as Path from 'node-match-path';

import { ApiError } from './ApiError';
import { Handler } from './Handler';
import { FunctionResponse } from './Response';
import { RequestContext } from './RequestContext';

export class FunctionRoute<T, U extends RequestContext> {
    constructor(
        private httpMethod: 'GET' | 'POST' | 'PUT' | 'DELETE',
        private path: string,
        private handler: Handler<T, U>,
    ) {}

    isMatch(requestContext: U) {
        return (
            this.httpMethod.toUpperCase() === requestContext.getHttpMethod().toUpperCase() &&
            Path.match(this.path, requestContext.getPath()).matches
        );
    }

    getPathParams(requestContext: U) {
        return Path.match(this.path, requestContext.getPath()).params || {};
    }

    parseBody(requestContext: U): T {
        // TODO allow custom validation to be injected
        try {
            if (!requestContext.getBody()) {
                throw new ApiError(StatusCodes.BAD_REQUEST);
            } else {
                return JSON.parse(requestContext.getBody());
            }
        } catch (e) {
            console.error(e);
            throw new ApiError(StatusCodes.BAD_REQUEST);
        }
    }

    okResponse(result?: T | T[]): FunctionResponse {
        return {
            statusCode: StatusCodes.OK,
            body: result ? JSON.stringify(result) : '',
        };
    }

    errorResponse(statusCode: StatusCodes): FunctionResponse {
        return {
            statusCode,
            body: getReasonPhrase(statusCode),
        };
    }

    async handle(requestContext: U): Promise<FunctionResponse> {
        try {
            const result = await this.handler(this, requestContext);

            return result;
        } catch (e) {
            console.error(e);

            return this.errorResponse(StatusCodes.INTERNAL_SERVER_ERROR);
        }
    }
}
