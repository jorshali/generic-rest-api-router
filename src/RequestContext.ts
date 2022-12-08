/**
 * Interface that is implemented for the specific routing context this library is being used in.
 * Each environment has it's own event objects that represent the request details.  This interface
 * provides the basic details that are needed to appropriately route and handle a request.  Additional
 * contextual information can be provided by the specific implementation.
 */
export interface RequestContext {
    /**
     * Returns the HTTP method for the request.
     */
    getHttpMethod(): string;

    /**
     * Returns the URI path of the request.  This may include path parameters.
     */
    getPath(): string;

    /**
     * Returnes the body of the request.  This is generally a JSON string, but it's not required.
     */
    getBody(): string;
}
