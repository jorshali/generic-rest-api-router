import { StatusCodes, getReasonPhrase } from 'http-status-codes';
import { FunctionRoute } from './FunctionRoute';
import { RequestContext } from './RequestContext';
import { ApiError } from './ApiError';
import { Handler } from './Handler';
import { FunctionResponse } from './FunctionResponse';

type FunctionRouterOptions = {
    basePath?: string;
    includeCORS?: boolean;
};

export class FunctionRouter<T, U extends RequestContext> {
    private options: FunctionRouterOptions;
    private routes: FunctionRoute<T, U>[];

    constructor(options?: FunctionRouterOptions) {
        this.routes = [];
        this.options = options || {};
    }

    get(path: string, handler: Handler<T, U>) {
        this.routes.push(new FunctionRoute<T, U>('GET', this.calculateFullPath(path), handler));

        return this;
    }

    post(path: string, handler: Handler<T, U>) {
        this.routes.push(new FunctionRoute<T, U>('POST', this.calculateFullPath(path), handler));

        return this;
    }

    put(path: string, handler: Handler<T, U>) {
        this.routes.push(new FunctionRoute<T, U>('PUT', this.calculateFullPath(path), handler));

        return this;
    }

    delete(path: string, handler: Handler<T, U>) {
        this.routes.push(new FunctionRoute<T, U>('DELETE', this.calculateFullPath(path), handler));

        return this;
    }

    calculateRoute(requestContext: U) {
        return this.routes.find((route) => {
            return route.isMatch(requestContext);
        });
    }

    okResponse(result: T) {
        return {
            statusCode: StatusCodes.OK,
            body: JSON.stringify(result),
        };
    }

    errorResponse(statusCode: StatusCodes) {
        return {
            statusCode,
            body: getReasonPhrase(statusCode),
        };
    }

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
}
