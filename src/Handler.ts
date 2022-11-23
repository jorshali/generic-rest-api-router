import { FunctionRoute } from './FunctionRoute';
import { FunctionResponse } from './FunctionResponse';
import { RequestContext } from './RequestContext';

/**
 * A function that will be invoked when a matching REST request is made.
 */
export type Handler<T, U extends RequestContext> = (
    route: FunctionRoute<T, U>,
    requestContext: U
) => Promise<FunctionResponse>;
