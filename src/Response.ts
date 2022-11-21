export type FunctionResponse = {
    statusCode: number;
    headers?: {
        [header: string]: boolean | number | string;
    };
    body?: string | undefined;
};
