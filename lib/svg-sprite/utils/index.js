/**
 * Checks if value is a callable function.
 *
 * @param {string} value The value to check.
 * @returns {boolean}    Returns true if value is correctly classified, else false.
 */
function isFunction(value) {
    if (value && typeof value === 'function') {
        return true;
    }

    return false;
}

/**
 * Checks if value is the language type of Object. (e.g. arrays, functions, objects, regexes, new Number(0),
 * and new String(''))
 *
 * @param {any} value The value to check.
 * @returns {boolean} Returns true if value is an object, else false.
 */
function isObject(value) {
    return value instanceof Object;
}

/**
 * Checks if value is an Object
 *
 * @param {any} value The value to check.
 * @returns {boolean} Returns true if value is an object, else false.
 */
function isPlainObject(value) {
    return Object.prototype.toString.call(value) === '[object Object]';
}

module.exports = {
    isFunction,
    isObject,
    isPlainObject
};
