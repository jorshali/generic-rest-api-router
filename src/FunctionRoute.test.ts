import { describe, expect, test, jest } from '@jest/globals';
import { Handler } from './Handler';
import { FunctionRoute } from './FunctionRoute';
import { Post } from './Post';
import { RequestContext } from './RequestContext';

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

describe('Route module', () => {
    const handler = jest.fn<Handler<Post, TestRequestContext>>();

    test('parses a route to get params', () => {
        const route = new FunctionRoute('GET', '/employee', '/:id', handler);
        const params = route.getPathParams(new TestRequestContext('GET', '/employee/22', ''));

        expect(params.id).toBe('22');
    });

    test('parses a route to get params but none found', () => {
        const route = new FunctionRoute('GET', '/employee', '', handler);
        const params = route.getPathParams(new TestRequestContext('GET', '/employee/22', ''));

        expect(params.id).toBeFalsy();
    });

    test('is a match', () => {
        const route = new FunctionRoute('POST', '/employee', '/:id', handler);

        const isMatch = route.isMatch(new TestRequestContext('POST', '/employee/22', ''));

        expect(isMatch).toBeTruthy();
    });

    test('is not a match', () => {
        const route = new FunctionRoute('GET', '/', ':id', handler);

        const isMatch = route.isMatch(new TestRequestContext('GET', '/employee/22', ''));

        expect(isMatch).toBeFalsy();
    });

    test('parses a route to get params when URL is complete', () => {
        const route = new FunctionRoute('GET', '/employee', '/:id', handler);
        const params = route.getPathParams(new TestRequestContext('GET', 'http://localhost:8080/api/employee/22', ''));

        expect(params.id).toBe('22');
    });
});
