'use strict';

const stylus = require('stylus');
const less = require('less');

module.exports = {
    async stylus(...args) {
        return new Promise((resolve, reject) => {
            stylus.render(...args, (err, result) => {
                if (err) {
                    return reject(err);
                }

                resolve(result);
            });
        });
    },
    async less(...args) {
        return new Promise((resolve, reject) => {
            less.render(...args, (err, result) => {
                if (err) {
                    return reject(err);
                }

                resolve(result);
            });
        });
    }
};
