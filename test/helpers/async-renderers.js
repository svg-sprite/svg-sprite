'use strict';

const stylus = require('stylus');
const less = require('less');

module.exports = {
    async stylus(...args) {
        return new Promise((resolve, reject) => {
            stylus.render(...args, (error, result) => {
                if (error) {
                    return reject(error);
                }

                resolve(result);
            });
        });
    },
    async less(...args) {
        return new Promise((resolve, reject) => {
            less.render(...args, (error, result) => {
                if (error) {
                    return reject(error);
                }

                resolve(result);
            });
        });
    }
};
