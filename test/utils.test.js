'use strict';

/* eslint-disable unicorn/new-for-builtins, no-new-wrappers, prefer-regex-literals */

const assert = require('assert').strict;
const { isFunction, isObject, isString, isPlainObject } = require('../lib/svg-sprite/utils/index.js');

describe('utils', () => {
    describe('isFunction', () => {
        it('should return true for a class', () => {
            assert.equal(isFunction(class {}), true);
        });

        it('should return true for a function', () => {
            assert.equal(isFunction(() => {}), true);
        });

        it('should return true for an async function', () => {
            assert.equal(isFunction(async() => {}), true);
        });

        it('should return true for generator function', () => {
            assert.equal(isFunction(function * () {}), true);
        });

        it('should return false for a RegExp', () => {
            assert.equal(isFunction(/a/g), false);
        });

        it('should return false for a null value', () => {
            assert.equal(isFunction(null), false);
        });

        it('should return false for an undefined value', () => {
            assert.equal(isFunction(undefined), false);
        });

        it('should return false for a plain object', () => {
            assert.equal(isFunction({}), false);
        });

        it('should return false for an array', () => {
            assert.equal(isFunction([1, 2, 3]), false);
        });

        it('should return false for a numeric value', () => {
            assert.equal(isFunction(123), false);
        });

        it('should return false for a string', () => {
            assert.equal(isFunction('test'), false);
        });

        it('should return false for a boolean value', () => {
            assert.equal(isFunction(false), false);
        });
    });

    describe('isObject', () => {
        it('should return true for an object', () => {
            assert.equal(isObject({}), true);
        });

        it('should return true for a new String', () => {
            assert.equal(isObject(new String('')), true);
        });

        it('should return true for a new Regexp', () => {
            assert.equal(isObject(new RegExp('')), true);
        });

        it('should return true for a new Number', () => {
            assert.equal(isObject(new Number(1)), true);
        });

        it('should return true for a new Boolean', () => {
            assert.equal(isObject(new Boolean()), true);
        });

        it('should return false for a new Array', () => {
            assert.equal(isObject(Array.from({ length: 1 })), false);
        });

        it('should return false for an array', () => {
            assert.equal(isObject([1, 2, 3]), false);
        });

        it('should return false for a Function constructor', () => {
            assert.equal(isObject(Function), false);
        });

        it('should return false for a null value', () => {
            assert.equal(isObject(null), false);
        });

        it('should return false for an undefined value', () => {
            assert.equal(isObject(undefined), false);
        });

        it('should return false for a string value', () => {
            assert.equal(isObject('test'), false);
        });

        it('should return false for a boolean value', () => {
            assert.equal(isObject(false), false);
        });

        it('should return false for a function', () => {
            assert.equal(isObject(() => {}), false);
        });

        it('should return false for a Symbol', () => {
            assert.equal(isObject(Symbol('test')), false);
        });
    });

    describe('isString', () => {
        it('should return true for a string', () => {
            assert.equal(isString('test'), true);
        });

        it('should return false for an array', () => {
            assert.equal(isString([1, 2, 3]), false);
        });

        it('should return false for a Function constructor', () => {
            assert.equal(isString(Function), false);
        });

        it('should return false for a null value', () => {
            assert.equal(isString(null), false);
        });

        it('should return false for an undefined value', () => {
            assert.equal(isString(undefined), false);
        });

        it('should return false for a boolean value', () => {
            assert.equal(isString(false), false);
        });
    });

    describe('isPlainObject', () => {
        it('should return true for an object', () => {
            assert.equal(isPlainObject({ a: 1 }), true);
        });

        it('should return false for a new String', () => {
            assert.equal(isPlainObject(new String('')), false);
        });

        it('should return false for a new Regexp', () => {
            assert.equal(isPlainObject(new RegExp('')), false);
        });

        it('should return false for a new Number', () => {
            assert.equal(isPlainObject(new Number(1)), false);
        });

        it('should return false for a new Boolean', () => {
            assert.equal(isPlainObject(new Boolean()), false);
        });

        it('should return false for a new Array', () => {
            assert.equal(isPlainObject(Array.from({ length: 1 })), false);
        });

        it('should return false for an array', () => {
            assert.equal(isPlainObject([1, 2, 3]), false);
        });

        it('should return false for a Function constructor', () => {
            assert.equal(isPlainObject(Function), false);
        });

        it('should return false for a null value', () => {
            assert.equal(isPlainObject(null), false);
        });

        it('should return false for an undefined value', () => {
            assert.equal(isPlainObject(undefined), false);
        });

        it('should return false for a string value', () => {
            assert.equal(isPlainObject('test'), false);
        });

        it('should return false for a boolean value', () => {
            assert.equal(isPlainObject(false), false);
        });

        it('should return false for a function', () => {
            assert.equal(isPlainObject(() => {}), false);
        });

        it('should return false for a Symbol', () => {
            assert.equal(isPlainObject(Symbol('test')), false);
        });
    });
});
