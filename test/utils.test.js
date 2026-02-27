'use strict';

/* eslint-disable unicorn/new-for-builtins, no-new-wrappers, prefer-regex-literals */

const {
  isFunction,
  isObject,
  isString,
  isPlainObject,
  prettyBytes,
  trimStart,
  zipObject
} = require('../lib/svg-sprite/utils/index.js');

describe('utils', () => {
  describe('isFunction', () => {
    it('should return true for a class', () => {
      expect(isFunction(class {})).toBe(true);
    });

    it('should return true for a function', () => {
      expect(isFunction(() => {})).toBe(true);
    });

    it('should return true for an async function', () => {
      expect(isFunction(async() => {})).toBe(true);
    });

    it('should return true for generator function', () => {
      expect(isFunction(function * () {})).toBe(true);
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

  describe('prettyBytes', () => {
    it('should return "0 Bytes" for zero', () => {
      expect(prettyBytes(0)).toBe('0 Bytes');
    });

    it('should return bytes for small values', () => {
      expect(prettyBytes(100)).toBe('100 Bytes');
    });

    it('should return kB at 1024 boundary', () => {
      expect(prettyBytes(1024)).toBe('1 kB');
    });

    it('should return decimal kB for non-round values', () => {
      expect(prettyBytes(1536)).toBe('1.5 kB');
    });

    it('should return MB for megabyte values', () => {
      expect(prettyBytes(1_048_576)).toBe('1 MB');
    });

    it('should return GB for gigabyte values', () => {
      expect(prettyBytes(1_073_741_824)).toBe('1 GB');
    });

    it('should return "1 Bytes" for size of 1', () => {
      expect(prettyBytes(1)).toBe('1 Bytes');
    });

    it('should return "0 Bytes" for negative values', () => {
      expect(prettyBytes(-1)).toBe('0 Bytes');
    });
  });

  describe('trimStart', () => {
    it('should trim the start of a string of space characters', () => {
      expect(trimStart('  abc  ')).toBe('abc  ');
    });

    it('allow specifying a set of characters to trim', () => {
      expect(trimStart('../././../../somefile.txt', '/.')).toBe('somefile.txt');
    });

    it('coerces undefined inputs to strings', () => {
      expect(trimStart(undefined)).toBe('');
    });

    it('coerces null inputs to strings', () => {
      expect(trimStart(null, '*')).toBe('');
    });

    it('handles empty string inputs', () => {
      expect(trimStart('', '_-_')).toBe('');
    });

    it('handles empty string of chars to trim', () => {
      const string = '   a lovely string   ';

      expect(trimStart(string, '')).toBe(string);
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
