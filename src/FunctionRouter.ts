import { StatusCodes, getReasonPhrase } from 'http-status-codes';
import { FunctionRoute } from './FunctionRoute';
import { RequestContext } from './RequestContext';
import { Handler } from './Handler';
import { FunctionResponse } from './FunctionResponse';

type FunctionRouterOptions = {
    basePath?: string;
    includeCORS?: boolean;
};

/**
 * Defines a REST API and the functions that will be invoked for all matching HTTP methods and paths.
 */
export class FunctionRouter<T, U extends RequestContext> {
    private options: FunctionRouterOptions;
    private routes: FunctionRoute<T, U>[];

    constructor(options?: FunctionRouterOptions) {
        this.routes = [];
        this.options = options || {};
    }

    /**
     * Specifies a handler that should be called when an HTTP GET method request is made with 
     * the provided path.
     * 
     * @param path a URI path
     * @param handler a function to be called when a GET request with the matching path is made
     * @returns this FunctionRouter instance
     */
    get(path: string, handler: Handler<T, U>) {
        this.routes.push(new FunctionRoute<T, U>('GET', this.calculateFullPath(path), handler));

        return this;
    }

    /**
     * Specifies a handler that should be called when an HTTP POST method request is made with 
     * the provided path.
     * 
     * @param path a URI path
     * @param handler a function to be called when a POST request with the matching path is made
     * @returns this FunctionRouter instance
     */
    post(path: string, handler: Handler<T, U>) {
        this.routes.push(new FunctionRoute<T, U>('POST', this.calculateFullPath(path), handler));

        return this;
    }

    /**
     * Specifies a handler that should be called when an HTTP PUT method request is made with 
     * the provided path.
     * 
     * @param path a URI path
     * @param handler a function to be called when a PUT request with the matching path is made
     * @returns this FunctionRouter instance
     */
    put(path: string, handler: Handler<T, U>) {
        this.routes.push(new FunctionRoute<T, U>('PUT', this.calculateFullPath(path), handler));

        return this;
    }

    /**
     * Specifies a handler that should be called when an HTTP DELETE method request is made with 
     * the provided path.
     * 
     * @param path a URI path
     * @param handler a function to be called when a DELETE request with the matching path is made
     * @returns this FunctionRouter instance
     */
    delete(path: string, handler: Handler<T, U>) {
        this.routes.push(new FunctionRoute<T, U>('DELETE', this.calculateFullPath(path), handler));

        return this;
    }

    /**
     * Calls the appropriate Handler based on the HTTP method and path found in the
     * requestContext.  Returns the result of the handler execution.
     * 
     * @param requestContext 
     * @returns handler result
     */
    async handleRequest(requestContext: U): Promise<FunctionResponse> {
        const route = this.calculateRoute(requestContext);

        let response: FunctionResponse = {
            statusCode: StatusCodes.FORBIDDEN,
            body: getReasonPhrase(StatusCodes.FORBIDDEN)
        };

        if (route) {
            response = await route.handle(requestContext);
        }

        response.headers = response.headers || {};

        if (this.options.includeCORS) {
            response.headers['Access-Control-Allow-Origin'] = '*';
        }

        response.headers['Content-Type'] = 'application/json';

        return response;
    }

    private calculateFullPath(path: string) {
        if (this.options.basePath) {
            return `${this.options.basePath}${path}`;
        }

        return path;
    }

    private calculateRoute(requestContext: U) {
        return this.routes.find((route) => {
            return route.isMatch(requestContext);
        });
    }
}
