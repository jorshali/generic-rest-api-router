import { describe, expect, test, beforeEach, jest } from '@jest/globals';
import { FunctionRouter } from './FunctionRouter';
import { Handler } from './Handler';
import { Post } from './Post';
import { RequestContext } from './RequestContext';

const post: Post = {
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

    const createHandler = jest.fn<Handler<Post, TestRequestContext>>();
    const findHandler = jest.fn<Handler<Post, TestRequestContext>>();
    const findByIdHandler = jest.fn<Handler<Post, TestRequestContext>>();
    const updateHandler = jest.fn<Handler<Post, TestRequestContext>>();
    const deleteHandler = jest.fn<Handler<Post, TestRequestContext>>();

    beforeEach(() => {
        router = new FunctionRouter<Post, TestRequestContext>('')
            .post('/posts', createHandler)
            .get('/posts', findHandler)
            .get('/posts/:id', findByIdHandler)
            .put('/posts/:id', updateHandler)
            .delete('/posts/:id', deleteHandler);
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
        await router.get('/posts/:id/custom', async (route, requestContext) => {
            const pathParams = route.getPathParams(requestContext);

            expect(pathParams.id).toBe('22');

            return route.okResponse(post);
        });

        const result = await router.handleRequest(new TestRequestContext('GET', '/posts/22/custom', body));

        expect(createHandler.mock.calls.length).toBe(0);
        expect(findHandler.mock.calls.length).toBe(0);
        expect(findByIdHandler.mock.calls.length).toBe(0);
        expect(updateHandler.mock.calls.length).toBe(0);
        expect(deleteHandler.mock.calls.length).toBe(0);

        expect(result).toStrictEqual({
            statusCode: 200,
            body: JSON.stringify(post),
        });
    });

    test('route handling with JSON body processing', async () => {
        await router.post('/posts/:id/custom', async (route, requestContext) => {
            const post = route.parseBody(requestContext);

            expect(post).toStrictEqual({
                postId: '1',
                slug: 'testing-1',
                createDate: 12345678,
                title: 'Testing 1',
                content: 'test',
            });

            return route.okResponse(post);
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
            body: JSON.stringify(post),
        });
    });
});
