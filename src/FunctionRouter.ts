import { StatusCodes, getReasonPhrase } from 'http-status-codes';
import { FunctionRoute } from './FunctionRoute';
import { RequestContext } from './RequestContext';
import { ApiError } from './ApiError';
import { Handler } from './Handler';

type FunctionRouterOptions = {
    includeCORS?: boolean;
};

export class FunctionRouter<T, U extends RequestContext> {
    private routes: FunctionRoute<T, U>[];
    private customRoutes: FunctionRoute<T, U>[];

    constructor(private basePath: string, private options: FunctionRouterOptions = {}) {
        this.routes = [];
        this.customRoutes = [];
    }

    get(path: string, handler: Handler<T, U>) {
        this.routes.push(new FunctionRoute<T, U>('GET', path, handler));

        return this;
    }

    post(path: string, handler: Handler<T, U>) {
        this.routes.push(new FunctionRoute<T, U>('POST', path, handler));

        return this;
    }

    put(path: string, handler: Handler<T, U>) {
        this.routes.push(new FunctionRoute<T, U>('PUT', path, handler));

        return this;
    }

    delete(path: string, handler: Handler<T, U>) {
        this.routes.push(new FunctionRoute<T, U>('DELETE', path, handler));

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

    async handleRequest(requestContext: U) {
        const route = this.calculateRoute(requestContext);

        if (route) {
            let response = route.okResponse();

            try {
                response = await route.handle(requestContext);
            } catch (e) {
                if (e instanceof ApiError) {
                    console.error(e);
                    return this.errorResponse((e as ApiError).statusCode);
                }

                console.error(e);
                return this.errorResponse(StatusCodes.BAD_REQUEST);
            }

            if (this.options.includeCORS) {
                response.headers = response.headers || {};
                response.headers['Content-Type'] = 'application/json';
                response.headers['Access-Control-Allow-Origin'] = '*';
            }

            return response;
        }

        return {
            statusCode: StatusCodes.FORBIDDEN,
            body: getReasonPhrase(StatusCodes.FORBIDDEN),
        };
    }
}
