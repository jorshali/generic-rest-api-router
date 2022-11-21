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
    private routes: FunctionRoute<T, U>[];
    private customRoutes: FunctionRoute<T, U>[];

    constructor(private options: FunctionRouterOptions = {}) {
        this.routes = [];
        this.customRoutes = [];
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
        if (this.customRoutes.length > 0) {
            const customRoute = this.customRoutes.find((route) => {
                return route.isMatch(requestContext);
            });

            if (customRoute) {
                return customRoute;
            }
        }

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
            body: getReasonPhrase(StatusCodes.FORBIDDEN),
        };

        if (route) {
            try {
                response = await route.handle(requestContext);
            } catch (e) {
                if (e instanceof ApiError) {
                    console.error(e);
                    response = this.errorResponse((e as ApiError).statusCode);
                }

                console.error(e);
                response = this.errorResponse(StatusCodes.BAD_REQUEST);
            }
        }

        if (this.options.includeCORS) {
            response.headers = response.headers || {};
            response.headers['Content-Type'] = 'application/json';
            response.headers['Access-Control-Allow-Origin'] = '*';
        }

        return response;
    }

    private calculateFullPath(path: string) {
        if (this.options.basePath) {
            return `${this.options.basePath}${path}`;
        }

        return path;
    }
}
