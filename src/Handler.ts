import { FunctionRoute } from './FunctionRoute';
import { FunctionResponse } from './FunctionResponse';
import { RequestContext } from './RequestContext';

export type Handler<T, U extends RequestContext> = (
    route: FunctionRoute<T, U>,
    requestContext: U,
) => Promise<FunctionResponse>;
