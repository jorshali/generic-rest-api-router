
# generic-rest-api-router

A simple, generic REST API router for use with serverless functions.

## Installation

* `npm i generic-rest-api-router`

## Basic usage

This project is only intended to be a base to be extended for a specific environment.  In order to apply the `generic-rest-api-router` to an environment, you need to implement the `RequestContext` interface.

For example, for usage within AWS Lambda, you could define the following `AWSRequestContext`:

```
export class AwsRequestContext implements RequestContext {
  constructor(public event: APIGatewayProxyEvent, public context: Context) {
  }

  getHttpMethod(): string {
    return this.event.httpMethod;
  }

  getPath(): string {
    return this.event.path;
  }
  
  getBody(): string {
    return this.event.body || '';
  }
}
```

You can then extend the `FunctionRouter` to define the templated classes that will be used in the `Handler` functions:

```
export class AwsFunctionRouter<T> extends FunctionRouter<T, AwsRequestContext> {
  async handle(requestContext: AwsRequestContext): Promise<APIGatewayProxyResult> {
    const response = await super.handleRequest(requestContext);

    return {
      headers: response.headers,
      statusCode: response.statusCode,
      body: response.body || ''
    }
  }
}
```

Once these classes been defined, you can then create your routes in a Lambda function:

```
const router = new AwsFunctionRouter({
    basePath: '/post-service',
    includeCORS: true
  })
  .get('', async (route) => {
    const postRepository = new PostRepository();

    return route.okResponse(await postRepository.findAll());
  })
  .get('/:id', async (route, requestContext) => {
    const postRepository = new PostRepository();

    const id = route.getPathParams(requestContext).id;
    const post = await postRepository.findPostById(id);

    if (!post) {
      return route.errorResponse(StatusCodes.NOT_FOUND);
    }

    return route.okResponse(post);
  });

export const lambdaHandler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
  return await router.handle(new AwsRequestContext(event, context));
};
```

You can find a working example in [aws-sam-rest-api-starter](https://github.com/jorshali/aws-sam-rest-api-starter).