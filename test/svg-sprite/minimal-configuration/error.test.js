'use strict';

const SVGSpriter = require('../../../lib/svg-sprite.js');

class TestError extends Error {}

describe('svg-sprite: errors', () => {
    let spriter;

    beforeEach(() => {
        spriter = new SVGSpriter({
            shape: {
                dest: 'svg'
            },
            mode: {
                symbol: true
            }
        });
        jest.spyOn(spriter, '_layout').mockImplementation((_, cb) => {
            cb(new TestError(), {}, {});
        });
    });

    it('should throw error if compilation has failed in async mode', async () => {
        expect.hasAssertions();
        await expect(async () => {
            await spriter.compileAsync();
        }).rejects.toThrow(TestError);
    });

    // eslint-disable-next-line jest/no-done-callback
    it('should throw error if compilation has failed in callback mode', done => {
        expect.hasAssertions();

        spriter.compile(error => {
            expect(error).toBeInstanceOf(TestError);

            done();
        });
    });
});
