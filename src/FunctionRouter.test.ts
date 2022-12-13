import { describe, expect, test, beforeEach, jest } from '@jest/globals';
import { Mock } from 'jest-mock';
import { FunctionRouter } from './FunctionRouter';
import { Handler } from './Handler';
import { Post } from './Post';
import { RequestContext } from './RequestContext';

const defaultPost: Post = {
    postId: '1',
    slug: 'testing-1',
    createDate: 12345678,
    title: 'Testing 1',
    content: 'test',
};

class TestRequestContext implements RequestContext {
    constructor(private httpMethod: string, private path: string, private body: string) {}

    getPath() {
        return this.path;
    }

    getHttpMethod(): string {
        return this.httpMethod;
    }

    getBody(): string {
        return this.body;
    }
}

describe('Crud router module', () => {
    let router: FunctionRouter<Post, TestRequestContext>;

    const body =
        '{"postId": "1","slug": "my-first-post", "createDate": 1238381727, "title": "My First Post", "content": "This is my first post"}';

    let createHandler: Mock<Handler<Post, TestRequestContext>>;
    let findHandler: Mock<Handler<Post, TestRequestContext>>;
    let findByIdHandler: Mock<Handler<Post, TestRequestContext>>;
    let updateHandler: Mock<Handler<Post, TestRequestContext>>;
    let deleteHandler: Mock<Handler<Post, TestRequestContext>>;

    beforeEach(() => {
        createHandler = jest.fn<Handler<Post, TestRequestContext>>();
        findHandler = jest.fn<Handler<Post, TestRequestContext>>();
        findByIdHandler = jest.fn<Handler<Post, TestRequestContext>>();
        updateHandler = jest.fn<Handler<Post, TestRequestContext>>();
        deleteHandler = jest.fn<Handler<Post, TestRequestContext>>();

        router = new FunctionRouter<Post, TestRequestContext>({
            resourcePath: '/posts',
        })
            .post('', createHandler)
            .get('', findHandler)
            .get('/:id', findByIdHandler)
            .put('/:id', updateHandler)
            .delete('/:id', deleteHandler);
    });

    test('handles create', async () => {
        await router.handleRequest(new TestRequestContext('POST', '/posts', body));

        expect(createHandler.mock.calls.length).toBe(1);
        expect(findHandler.mock.calls.length).toBe(0);
        expect(findByIdHandler.mock.calls.length).toBe(0);
        expect(updateHandler.mock.calls.length).toBe(0);
        expect(deleteHandler.mock.calls.length).toBe(0);
    });

    test('handles find', async () => {
        await router.handleRequest(new TestRequestContext('GET', '/posts', body));

        expect(createHandler.mock.calls.length).toBe(0);
        expect(findHandler.mock.calls.length).toBe(1);
        expect(findByIdHandler.mock.calls.length).toBe(0);
        expect(updateHandler.mock.calls.length).toBe(0);
        expect(deleteHandler.mock.calls.length).toBe(0);
    });

    test('handles findById', async () => {
        await router.handleRequest(new TestRequestContext('GET', '/posts/1', body));

        expect(createHandler.mock.calls.length).toBe(0);
        expect(findHandler.mock.calls.length).toBe(0);
        expect(findByIdHandler.mock.calls.length).toBe(1);
        expect(updateHandler.mock.calls.length).toBe(0);
        expect(deleteHandler.mock.calls.length).toBe(0);
    });

    test('handles update', async () => {
        await router.handleRequest(new TestRequestContext('PUT', '/posts/1', body));

        expect(createHandler.mock.calls.length).toBe(0);
        expect(findHandler.mock.calls.length).toBe(0);
        expect(findByIdHandler.mock.calls.length).toBe(0);
        expect(updateHandler.mock.calls.length).toBe(1);
        expect(deleteHandler.mock.calls.length).toBe(0);
    });

    test('handles delete', async () => {
        await router.handleRequest(new TestRequestContext('DELETE', '/posts/1', body));

        expect(createHandler.mock.calls.length).toBe(0);
        expect(findHandler.mock.calls.length).toBe(0);
        expect(findByIdHandler.mock.calls.length).toBe(0);
        expect(updateHandler.mock.calls.length).toBe(0);
        expect(deleteHandler.mock.calls.length).toBe(1);
    });

    test('route handling with path param', async () => {
        await router.get('/:id/custom', async (route, requestContext) => {
            const pathParams = route.getPathParams(requestContext);

            expect(pathParams.id).toBe('22');

            return route.okResponse(defaultPost);
        });

        const result = await router.handleRequest(new TestRequestContext('GET', '/posts/22/custom', body));

        expect(createHandler.mock.calls.length).toBe(0);
        expect(findHandler.mock.calls.length).toBe(0);
        expect(findByIdHandler.mock.calls.length).toBe(0);
        expect(updateHandler.mock.calls.length).toBe(0);
        expect(deleteHandler.mock.calls.length).toBe(0);

        expect(result).toStrictEqual({
            statusCode: 200,
            body: JSON.stringify(defaultPost),
            headers: {
                'Content-Type': 'application/json',
            },
        });
    });

    test('route handling with JSON body processing', async () => {
        await router.post('/:id/custom', async (route, requestContext) => {
            const post = route.parseBody(requestContext);

            expect(post).toStrictEqual({
                postId: '1',
                slug: 'testing-1',
                createDate: 12345678,
                title: 'Testing 1',
                content: 'test',
            });

            return route.okResponse(defaultPost);
        });

        const result = await router.handleRequest(
            new TestRequestContext(
                'POST',
                '/posts/22/custom',
                '{"postId":"1","slug":"testing-1","createDate":12345678,"title":"Testing 1","content":"test"}',
            ),
        );

        expect(createHandler.mock.calls.length).toBe(0);
        expect(findHandler.mock.calls.length).toBe(0);
        expect(findByIdHandler.mock.calls.length).toBe(0);
        expect(updateHandler.mock.calls.length).toBe(0);
        expect(deleteHandler.mock.calls.length).toBe(0);

        expect(result).toStrictEqual({
            statusCode: 200,
            body: JSON.stringify(defaultPost),
            headers: {
                'Content-Type': 'application/json',
            },
        });
    });

    test('route handling with custom count', async () => {
        router = new FunctionRouter<Post, TestRequestContext>({
            resourcePath: '/posts',
        })
            .get('/count', async (route) => {
                return route.okResponse({ count: 1 });
            })
            .post('', createHandler)
            .get('', findHandler)
            .get('/:id', findByIdHandler)
            .put('/:id', updateHandler)
            .delete('/:id', deleteHandler);

        const result = await router.handleRequest(new TestRequestContext('GET', '/posts/count', ''));

        expect(createHandler.mock.calls.length).toBe(0);
        expect(findHandler.mock.calls.length).toBe(0);
        expect(findByIdHandler.mock.calls.length).toBe(0);
        expect(updateHandler.mock.calls.length).toBe(0);
        expect(deleteHandler.mock.calls.length).toBe(0);

        expect(result).toStrictEqual({
            statusCode: 200,
            body: '{"count":1}',
            headers: {
                'Content-Type': 'application/json',
            },
        });
    });

    test('route handling with CORS response', async () => {
        router = new FunctionRouter<Post, TestRequestContext>({
            resourcePath: '/posts',
            includeCORS: true,
        }).get('', async (route, requestContext) => {
            return route.okResponse([defaultPost]);
        });

        const result = await router.handleRequest(new TestRequestContext('GET', '/posts', ''));

        expect(result).toStrictEqual({
            statusCode: 200,
            body: `[${JSON.stringify(defaultPost)}]`,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
        });
    });

    test('handles create with no resourcePath', async () => {
        router = new FunctionRouter<Post, TestRequestContext>()
            .post('', createHandler)
            .get('', findHandler)
            .get('/:id', findByIdHandler)
            .put('/:id', updateHandler)
            .delete('/:id', deleteHandler);

        await router.handleRequest(new TestRequestContext('POST', '/', body));

        expect(createHandler.mock.calls.length).toBe(1);
        expect(findHandler.mock.calls.length).toBe(0);
        expect(findByIdHandler.mock.calls.length).toBe(0);
        expect(updateHandler.mock.calls.length).toBe(0);
        expect(deleteHandler.mock.calls.length).toBe(0);
    });

    test('handles create with no resourcePath and trailing slashes', async () => {
        router = new FunctionRouter<Post, TestRequestContext>()
            .post('/', createHandler)
            .get('/', findHandler)
            .get('/:id/', findByIdHandler)
            .put('/:id/', updateHandler)
            .delete('/:id/', deleteHandler);

        await router.handleRequest(new TestRequestContext('POST', '/', body));

        expect(createHandler.mock.calls.length).toBe(1);
        expect(findHandler.mock.calls.length).toBe(0);
        expect(findByIdHandler.mock.calls.length).toBe(0);
        expect(updateHandler.mock.calls.length).toBe(0);
        expect(deleteHandler.mock.calls.length).toBe(0);
    });

    test('handles create with no resourcePath and trailing slash on id', async () => {
        router = new FunctionRouter<Post, TestRequestContext>()
            .post('/', createHandler)
            .get('/', findHandler)
            .get('/:id/', findByIdHandler)
            .put('/:id/', updateHandler)
            .delete('/:id/', deleteHandler);

        await router.handleRequest(new TestRequestContext('PUT', '/22', body));

        expect(createHandler.mock.calls.length).toBe(0);
        expect(findHandler.mock.calls.length).toBe(0);
        expect(findByIdHandler.mock.calls.length).toBe(0);
        expect(updateHandler.mock.calls.length).toBe(1);
        expect(deleteHandler.mock.calls.length).toBe(0);
    });

    test('throws error on create with resourcePath as slash', async () => {
        expect(() =>
            new FunctionRouter<Post, TestRequestContext>({
                resourcePath: '/',
            }).post('/', createHandler),
        ).toThrowError();
    });
});
