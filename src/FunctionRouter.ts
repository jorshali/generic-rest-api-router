import { StatusCodes, getReasonPhrase } from 'http-status-codes';
import { FunctionRoute } from './FunctionRoute';
import { RequestContext } from './RequestContext';
import { Handler } from './Handler';
import { FunctionResponse } from './FunctionResponse';
import { ApiError } from './ApiError';

type FunctionRouterOptions<T, U extends RequestContext> = {
    resourcePath?: string;
    includeCORS?: boolean;
    customErrorHandler?: (route: FunctionRoute<T, U>, e: Error) => FunctionResponse;
};

/**
 * Defines a REST API and the functions that will be invoked for all matching HTTP methods and paths.
 */
export class FunctionRouter<T, U extends RequestContext> {
    private routes: FunctionRoute<T, U>[];

    constructor(private options: FunctionRouterOptions<T, U> = {}) {
        this.routes = [];
    }

    /**
     * Specifies a handler that should be called when an HTTP GET method request is made with
     * the provided path pre-pended by the configured resourcePath.
     *
     * @param path a URI path
     * @param handler a function to be called when a GET request with the matching path is made
     * @returns this FunctionRouter instance
     */
    get(path: string, handler: Handler<T, U>) {
        this.routes.push(new FunctionRoute<T, U>('GET', this.options.resourcePath, path, handler));

        return this;
    }

    /**
     * Specifies a handler that should be called when an HTTP POST method request is made with
     * the provided path pre-pended by the configured resourcePath.
     *
     * @param path a URI path
     * @param handler a function to be called when a POST request with the matching path is made
     * @returns this FunctionRouter instance
     */
    post(path: string, handler: Handler<T, U>) {
        this.routes.push(new FunctionRoute<T, U>('POST', this.options.resourcePath, path, handler));

        return this;
    }

    /**
     * Specifies a handler that should be called when an HTTP PUT method request is made with
     * the provided path pre-pended by the configured resourcePath.
     *
     * @param path a URI path
     * @param handler a function to be called when a PUT request with the matching path is made
     * @returns this FunctionRouter instance
     */
    put(path: string, handler: Handler<T, U>) {
        this.routes.push(new FunctionRoute<T, U>('PUT', this.options.resourcePath, path, handler));

        return this;
    }

    /**
     * Specifies a handler that should be called when an HTTP DELETE method request is made with
     * the provided path pre-pended by the configured resourcePath.
     *
     * @param path a URI path
     * @param handler a function to be called when a DELETE request with the matching path is made
     * @returns this FunctionRouter instance
     */
    delete(path: string, handler: Handler<T, U>) {
        this.routes.push(new FunctionRoute<T, U>('DELETE', this.options.resourcePath, path, handler));

        return this;
    }

    /**
     * Calls the appropriate Handler based on the HTTP method and path found in the
     * requestContext.  Returns the result of the handler execution.
     *
     * If the handler throws an error, by default, it is logged and an error response
     * is sent based on the appropriate HTTP status code.  If a customErrorHandler has
     * been provided, it will be called with the route and error.
     *
     * @param requestContext
     * @returns handler result
     */
    async handleRequest(requestContext: U): Promise<FunctionResponse> {
        const route = this.calculateRoute(requestContext);

        let response: FunctionResponse = {
            statusCode: StatusCodes.FORBIDDEN,
            body: getReasonPhrase(StatusCodes.FORBIDDEN),
        };

        if (route) {
            try {
                response = await route.handle(requestContext);
            } catch (e) {
                if (this.options.customErrorHandler) {
                    return this.options.customErrorHandler(route, e);
                } else {
                    if (e instanceof ApiError) {
                        return route.errorResponse((e as ApiError).statusCode);
                    }

                    return route.errorResponse(StatusCodes.INTERNAL_SERVER_ERROR);
                }
            }
        }

        response.headers = response.headers || {};

        if (this.options.includeCORS) {
            response.headers['Access-Control-Allow-Origin'] = '*';
        }

        response.headers['Content-Type'] = 'application/json';

        return response;
    }

    private calculateRoute(requestContext: U) {
        return this.routes.find((route) => {
            return route.isMatch(requestContext);
        });
    }
}
