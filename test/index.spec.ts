import { helloWorld } from '../src';

describe('Index', () => {
	test('should say Hello World', () => {
		expect(helloWorld()).toBe('Hello World');
	});
});