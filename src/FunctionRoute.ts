import { StatusCodes, getReasonPhrase } from 'http-status-codes';
import * as Path from 'node-match-path';

import { ApiError } from './ApiError';
import { Handler } from './Handler';
import { FunctionResponse } from './FunctionResponse';
import { RequestContext } from './RequestContext';

/**
 * Models a REST API route.  The route consists of an HTTP method, a path, and
 * a handler to be called when a request matches the route.  To support REST
 * requests, a route can contain path parameters.  The following examples are
 * routes with and without path parameters:
 *
 *   new FunctionRoute('GET', '/posts', '/:id', handler)
 *   new FunctionRoute('GET', '/posts', '', handler)
 *   new FunctionRoute('POST', '/posts', '', handler)
 *   new FunctionRoute('PUT', '/posts', '/:id', handler)
 *   new FunctionRoute('GET', '/posts', '/slug/:slug', handler)
 *
 */
export class FunctionRoute<T, U extends RequestContext> {
    constructor(
        private httpMethod: 'GET' | 'POST' | 'PUT' | 'DELETE',
        private resourcePath: string = '',
        private routePath: string = '/',
        private handler: Handler<T, U>,
    ) {
        if (resourcePath.charAt(resourcePath.length - 1) === '/') {
            throw new Error(
                'The resourcePath should not include a trailing slash.  If the path to the resource is ' +
                    'just /, simply leave out the resourcePath and include the / in the routePath.',
            );
        }
    }

    /**
     * Determines whether the provided requestContext matches the HTTP method and
     * path associated with this route.
     *
     * @param requestContext
     * @returns boolean indicating whether the route is a match
     */
    isMatch(requestContext: U) {
        const uriPath = this.calculateUriOnlyPath(requestContext);

        return (
            this.httpMethod.toUpperCase() === requestContext.getHttpMethod().toUpperCase() &&
            Path.match(this.getFullRoutePath(), uriPath).matches
        );
    }

    /**
     * Returns the path parameters for the provided RequestContext.  For the path definition:  /posts/:id,
     * the RequestContext path:  /posts/1, would result in the following result:
     *
     * { "id": "1" }
     *
     * All param values are strings and must be coerced to specific types.
     *
     * @param requestContext
     * @returns an object representing the path parameters
     */
    getPathParams(requestContext: U) {
        const uriPath = this.calculateUriOnlyPath(requestContext);

        return Path.match(this.getFullRoutePath(), uriPath).params || {};
    }

    /**
     * Parses the body of the RequestContext into an object from a JSON string.  If the body
     * is not valid JSON, the method will throw an ApiError resulting in a 400
     * response.
     *
     * @param requestContext
     * @returns an object representation of the JSON body
     */
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

    /**
     * Creates a FunctionResponse object for a 200 OK response.  if a result is provided it is
     * stringified into the body of the response.
     *
     * @param result
     * @returns a 200 OK FunctionResponse instance with the result as the JSON body
     */
    okResponse(result?: T | T[] | any): FunctionResponse {
        return {
            statusCode: StatusCodes.OK,
            body: result ? JSON.stringify(result) : '',
        };
    }

    /**
     * Creates a FunctionResponse object for the provided statusCode.  The standard
     * reason phrase for the statusCode is sent as the body of the response.
     *
     * @param statusCode
     * @returns a FunctionResponse for the provided statusCode
     */
    errorResponse(statusCode: StatusCodes): FunctionResponse {
        return {
            statusCode,
            body: JSON.stringify({
                message: getReasonPhrase(statusCode),
            }),
        };
    }

    /**
     * Calls on the handler provided to the constructor and returns the response.  If response is empty,
     * simply returns HTTP status OK.
     *
     * @param requestContext
     * @returns FunctionResponse based on the result of the handler
     */
    async handle(requestContext: U): Promise<FunctionResponse> {
        return (await this.handler(this, requestContext)) || this.okResponse();
    }

    private calculateUriOnlyPath(requestContext: U) {
        const path = requestContext.getPath();
        const uriStartingIndex = path.indexOf(this.resourcePath) || 0;

        return path.slice(uriStartingIndex, path.length);
    }

    private getFullRoutePath() {
        return `${this.resourcePath}${this.routePath}`;
    }
}
