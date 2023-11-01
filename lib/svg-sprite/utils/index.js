'use strict';

/**
 * Checks if value is a callable function.
 *
 * @param {any} value    The value to check.
 * @returns {boolean}    Returns true if value is correctly classified, else false.
 */
function isFunction(value) {
    return Boolean(value && typeof value === 'function');
}

/**
 * Checks if value is the language type of Object (e.g. objects, regexes, new Number(0),
 * and new String('')). Excluding arrays (new Array())
 *
 * @param {any} value The value to check.
 * @returns {boolean} Returns true if value is an object, else false.
 */
function isObject(value) {
    return typeof value === 'object' && value !== null;
}

/**
 * Checks if value is an Object
 *
 * @param {any} value The value to check.
 * @returns {boolean} Returns true if value is an plain object, else false.
 */
function isPlainObject(value) {
    return Object.prototype.toString.call(value) === '[object Object]';
}

/**
 * Checks if value is a String
 *
 * @param {any} value The value to check.
 * @returns {boolean} Returns true if value is a String, else false.
 */
function isString(value) {
    return Object.prototype.toString.call(value) === '[object String]';
}

/**
 * Trim the start of a string of the specified characters.
 *
 * @param {string} inputString The string to trim the start of.
 * @param {string} [charsToTrim=' '] The characters to trim from the start of the string. Defaults to a single space. The order of the characters does not matter.
 * @returns {string} The trimmed string.
 */
function trimStart(inputString, charsToTrim = ' ') {
    if (!inputString) {
        return '';
    }

    const firstNonTrimCharIndex = [...inputString].findIndex(
        char => !charsToTrim.includes(char)
    );
    return inputString.substring(firstNonTrimCharIndex);
}

/**
 * @param {Array} array1    First array
 * @param {Array} array2    Second array
 * @returns {object}        The zipped Object
 */
function zipObject(array1, array2) {
    if (!(Array.isArray(array1) || Array.isArray(array2))) {
        throw new TypeError('Both parameters must be an array');
    }

    return Object.fromEntries(array1.map((_, i) => ([array1[i], array2[i]])));
}

module.exports = {
    isFunction,
    isObject,
    isPlainObject,
    isString,
    trimStart,
    zipObject
};
