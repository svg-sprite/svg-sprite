/**
 * Checks if value is a callable function.
 *
 * @param {string} f The value to check.
 * @returns {boolean}    Returns true if value is correctly classified, else false.
 */
function isFunction(f) {
    if (f && typeof f === 'function') {
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

module.exports = {
    isFunction,
    isObject
};
