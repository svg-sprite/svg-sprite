'use strict';

function asyncInit() {
    const queue = [];
    let instance;
    let initializing = false;

    function processQueue(type, result) {
        while (queue.length > 0) {
            queue.shift()[type](result);
        }
    }

    return function(fn) {
        if (instance) {
            return instance;
        }

        if (initializing) {
            return new Promise((resolve, reject) => {
                queue.push({ resolve, reject });
            });
        }

        initializing = true;

        return new Promise((resolve, reject) => {
            fn()
                .then(result => {
                    instance = result;
                    resolve(instance);
                    initializing = false;
                    processQueue('resolve', instance);
                })
                .catch(error => {
                    reject(error);
                    initializing = false;
                    processQueue('reject', error);
                });
        });
    };
}

module.exports = asyncInit;
