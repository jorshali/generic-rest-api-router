export interface RequestContext {
    getHttpMethod(): string;
    getPath(): string;
    getBody(): string;
}
