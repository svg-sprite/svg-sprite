'use strict';

const assert = require('assert');
const asyncIniter = require('../lib/async-init.js');

const delay = ms => new Promise(resolve => {
    setTimeout(resolve, ms);
});

describe('async-init', () => {
    it('should init correctly', async() => {
        let counter = 0;

        function fn() {
            return new Promise(resolve => {
                delay(1000).then(() => resolve(counter++));
            });
        }

        const asyncInit = asyncIniter();
        const result = await Promise.all([
            asyncInit(fn),
            asyncInit(fn),
            asyncInit(fn),
            asyncInit(fn),
            asyncInit(fn)
        ]);
        assert.deepStrictEqual(result, [0, 0, 0, 0, 0]);
    });

    it('should support more instantiation', () => {
        function fn1() {
            return new Promise(resolve => {
                delay(1000).then(() => resolve('fno1'));
            });
        }

        function fn2() {
            return new Promise(resolve => {
                delay(500).then(() => resolve('fno2'));
            });
        }

        const asyncInit1 = asyncIniter();
        const asyncInit2 = asyncIniter();

        return Promise.all([
            asyncInit1(fn1).then(result => assert.strictEqual(result, 'fno1')),
            asyncInit2(fn2).then(result => assert.strictEqual(result, 'fno2')),
            asyncInit2(fn2).then(result => assert.strictEqual(result, 'fno2')),
            asyncInit1(fn1).then(result => assert.strictEqual(result, 'fno1')),
            asyncInit2(fn2).then(result => assert.strictEqual(result, 'fno2'))
        ]);
    });

    it('should equal the references of singleton objects ', async() => {
        function fn1() {
            return new Promise(resolve => {
                delay(1000).then(() => resolve({ a: 1 }));
            });
        }

        const asyncInit = asyncIniter();

        const [instance1, instance2] = await Promise.all([
            asyncInit(fn1),
            asyncInit(fn1)
        ]);

        assert.strictEqual(instance1, instance2);
    });

    it('should equal the references of singleton objects if they are created separately', async() => {
        function fn1() {
            return new Promise(resolve => {
                delay(1000).then(() => resolve({ a: 1 }));
            });
        }

        const asyncInit = asyncIniter();

        const instance1 = await asyncInit(fn1);
        const instance2 = await asyncInit(fn1);

        assert.strictEqual(instance1, instance2);
    });
    it('should handle exceptions correctly', async() => {
        function fn() {
            return new Promise((resolve, reject) => {
                delay(1000).then(() => reject(new Error('Custom error')));
            });
        }

        const asyncInit = asyncIniter();

        try {
            await Promise.all([
                asyncInit(fn),
                asyncInit(fn)
            ]);
            assert.strictEqual(true, false);
        } catch (error) {
            assert.strictEqual(error.message, 'Custom error');
        }
    });

    it('should return with every error call', async() => {
        function fn() {
            return new Promise((resolve, reject) => {
                delay(1000).then(() => reject(new Error('Custom error')));
            });
        }

        const asyncInit = asyncIniter();
        let errorCounts = 0;

        await Promise.all([
            asyncInit(fn)
                .then(() => {
                    assert.strictEqual(true, false);
                })
                .catch(error => {
                    assert.deepStrictEqual(error.message, 'Custom error');
                    errorCounts++;
                }),
            asyncInit(fn)
                .then(() => {
                    assert.strictEqual(true, false);
                })
                .catch(error => {
                    assert.deepStrictEqual(error.message, 'Custom error');
                    errorCounts++;
                })
        ]);

        assert.strictEqual(errorCounts, 2);
    });
});
