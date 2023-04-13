'use strict';

/* eslint-disable unicorn/new-for-builtins, no-new-wrappers, prefer-regex-literals, jest/prefer-expect-assertions */

const { isFunction, isObject, isString, isPlainObject, zipObject } = require('../lib/svg-sprite/utils/index.js');

describe('utils', () => {
    describe('isFunction', () => {
        it('should return true for a class', () => {
            expect(isFunction(class {})).toBe(true);
        });

        it('should return true for a function', () => {
            expect(isFunction(() => {})).toBe(true);
        });

        it('should return true for an async function', () => {
            expect(isFunction(async () => {})).toBe(true);
        });

        it('should return true for generator function', () => {
            expect(isFunction(function* () {})).toBe(true);
        });

        it('should return false for a RegExp', () => {
            expect(isFunction(/a/g)).toBe(false);
        });

        it('should return false for a null value', () => {
            expect(isFunction(null)).toBe(false);
        });

        it('should return false for an undefined value', () => {
            expect(isFunction(undefined)).toBe(false);
        });

        it('should return false for a plain object', () => {
            expect(isFunction({})).toBe(false);
        });

        it('should return false for an array', () => {
            expect(isFunction([1, 2, 3])).toBe(false);
        });

        it('should return false for a numeric value', () => {
            expect(isFunction(123)).toBe(false);
        });

        it('should return false for a string', () => {
            expect(isFunction('test')).toBe(false);
        });

        it('should return false for a boolean value', () => {
            expect(isFunction(false)).toBe(false);
        });
    });

    describe('isObject', () => {
        it('should return true for an object', () => {
            expect(isObject({})).toBe(true);
        });

        it('should return true for a new String', () => {
            expect(isObject(new String(''))).toBe(true);
        });

        it('should return true for a new Regexp', () => {
            expect(isObject(new RegExp(''))).toBe(true);
        });

        it('should return true for a new Number', () => {
            expect(isObject(new Number(1))).toBe(true);
        });

        it('should return true for a new Boolean', () => {
            expect(isObject(new Boolean())).toBe(true);
        });

        it('should return true for an array (lodash backport)', () => {
            // todo: must return false
            expect(isObject([1, 2, 3])).toBe(true);
        });

        it('should return false for a Function constructor', () => {
            expect(isObject(Function)).toBe(false);
        });

        it('should return false for a null value', () => {
            expect(isObject(null)).toBe(false);
        });

        it('should return false for an undefined value', () => {
            expect(isObject(undefined)).toBe(false);
        });

        it('should return false for a string value', () => {
            expect(isObject('test')).toBe(false);
        });

        it('should return false for a boolean value', () => {
            expect(isObject(false)).toBe(false);
        });

        it('should return false for a function', () => {
            expect(isObject(() => {})).toBe(false);
        });

        it('should return false for a Symbol', () => {
            expect(isObject(Symbol('test'))).toBe(false);
        });
    });

    describe('isString', () => {
        it('should return true for a string', () => {
            expect(isString('test')).toBe(true);
        });

        it('should return false for an array', () => {
            expect(isString([1, 2, 3])).toBe(false);
        });

        it('should return false for a Function constructor', () => {
            expect(isString(Function)).toBe(false);
        });

        it('should return false for a null value', () => {
            expect(isString(null)).toBe(false);
        });

        it('should return false for an undefined value', () => {
            expect(isString(undefined)).toBe(false);
        });

        it('should return false for a boolean value', () => {
            expect(isString(false)).toBe(false);
        });
    });

    describe('isPlainObject', () => {
        it('should return true for an object', () => {
            expect(isPlainObject({ a: 1 })).toBe(true);
        });

        it('should return false for a new String', () => {
            expect(isPlainObject(new String(''))).toBe(false);
        });

        it('should return false for a new Regexp', () => {
            expect(isPlainObject(new RegExp(''))).toBe(false);
        });

        it('should return false for a new Number', () => {
            expect(isPlainObject(new Number(1))).toBe(false);
        });

        it('should return false for a new Boolean', () => {
            expect(isPlainObject(new Boolean())).toBe(false);
        });

        it('should return false for a new Array', () => {
            expect(isPlainObject(Array.from({ length: 1 }))).toBe(false);
        });

        it('should return false for an array', () => {
            expect(isPlainObject([1, 2, 3])).toBe(false);
        });

        it('should return false for a Function constructor', () => {
            expect(isPlainObject(Function)).toBe(false);
        });

        it('should return false for a null value', () => {
            expect(isPlainObject(null)).toBe(false);
        });

        it('should return false for an undefined value', () => {
            expect(isPlainObject(undefined)).toBe(false);
        });

        it('should return false for a string value', () => {
            expect(isPlainObject('test')).toBe(false);
        });

        it('should return false for a boolean value', () => {
            expect(isPlainObject(false)).toBe(false);
        });

        it('should return false for a function', () => {
            expect(isPlainObject(() => {})).toBe(false);
        });

        it('should return false for a Symbol', () => {
            expect(isPlainObject(Symbol('test'))).toBe(false);
        });
    });

    describe('zipObject', () => {
        it('should return the zipped object', () => {
            expect(zipObject(['a', 'b'], [1, 2])).toStrictEqual({ a: 1, b: 2 });
        });

        it('should return the zipped object with unbalanced arrays', () => {
            expect(zipObject(['a', 'b', 'c'], [1, 2])).toStrictEqual({ a: 1, b: 2, c: undefined });
            expect(zipObject(['a'], [1, 2])).toStrictEqual({ a: 1 });
        });

        it('should not fail with empty arrays', () => {
            expect(zipObject([], [])).toStrictEqual({});
        });

        it('should throw error if non-array value passed', () => {
            expect(() => {
                zipObject(1, false);
            }).toThrow(new TypeError('Both parameters must be an array'));
        });
    });
});
