'use strict';

const assert = require('assert').strict;
const { isFunction, isObject } = require('../lib/svg-sprite/utils/index.js');

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
    });

    describe('isObject', () => {
        it('should return true for an object', () => {
            assert.equal(isObject({}), true);
        });

        it('should return true for an array', () => {
            assert.equal(isObject([1, 2, 3]), true);
        });

        it('should return true for a Function constructor', () => {
            assert.equal(isObject(Function), true);
        });

        it('should return false for a null value', () => {
            assert.equal(isObject(null), false);
        });

        it('should return false for an undefined value', () => {
            assert.equal(isObject(undefined), false);
        });
    });
});
