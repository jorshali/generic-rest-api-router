/**
 * Models the response to be sent back from the function route.  An HTTP statusCode
 * is the minimal response.
 */
export type FunctionResponse = {
    statusCode: number;
    headers?: {
        [header: string]: boolean | number | string;
    };
    body?: string | undefined;
};
