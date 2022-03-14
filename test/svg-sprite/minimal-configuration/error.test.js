'use strict';

const assert = require('assert').strict;
const SVGSpriter = require('../../../lib/svg-sprite.js');

class TestError extends Error {}

describe('svg-sprite: errors', () => {
    let spriter;

    beforeEach(() => {
        spriter = new SVGSpriter({
            shape: {
                dest: 'svg'
            }
        });
    });

    it('should throw error if compilation has failed in async mode', async() => {
        spriter._layout = (_, cb) => {
            cb(new TestError(), {}, {});
        };

        await assert.rejects(async() => {
            await spriter.compileAsync();
        }, TestError);
    });

    it('should throw error if compilation has failed in callback mode', done => {
        spriter._layout = (_, cb) => {
            cb(new TestError('test'), {}, {});
        };

        spriter.compile(error => {
            assert.equal(error instanceof TestError, true);
            done();
        });
    });
});
