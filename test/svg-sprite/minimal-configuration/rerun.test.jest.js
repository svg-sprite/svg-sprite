'use strict';

/* eslint-disable max-nested-callbacks */
const path = require('path');
const glob = require('glob');
const SVGSpriter = require('../../../lib/svg-sprite.js');
const { addFixtureFiles } = require('../../helpers/add-files.js');

const { paths } = require('../../helpers/constants.js');
const removeTmpPath = require('../../helpers/remove-temp-path.js');

const cwd = path.join(paths.fixtures, 'svg/single');
const weather = glob.sync('**/weather*.svg', { cwd });

const tmpPath = path.join(paths.tmp, 'rerun');

describe('testing rerun', () => {
    beforeAll(removeTmpPath.bind(null, tmpPath));

    // eslint-disable-next-line jest/no-done-callback
    it('creates 5 files and then additional 1 on each layout after rerun when all render types disabled', done => {
        expect.assertions(2 * 4);

        const spriter = new SVGSpriter({
            dest: tmpPath
        });

        addFixtureFiles(spriter, weather, cwd);

        spriter.compile({
            css: {
                sprite: 'svg/css.vertical.svg',
                layout: 'vertical',
                dimensions: true,
                render: {
                    css: true,
                    scss: true,
                    less: true,
                    styl: true
                }
            }
        }, async(error, firstResult) => {
            if (error) {
                return done(error);
            }

            expect(firstResult.css).toBeInstanceOf(Object);
            expect(Object.values(firstResult.css)).toHaveLength(5);

            const otherLayouts = ['horizontal', 'diagonal', 'packed'];

            const promises = otherLayouts.map(mode => {
                return new Promise((resolve, reject) => {
                    spriter.compile({
                        css: {
                            sprite: `svg/css.${mode}.svg`,
                            layout: 'horizontal'
                        }
                    }, (err, result) => {
                        if (err) {
                            return reject(err);
                        }

                        expect(result.css).toBeInstanceOf(Object);
                        expect(Object.values(result.css)).toHaveLength(1);
                        resolve();
                    });
                });
            });

            try {
                await Promise.all(promises);
                done();
            } catch (error) {
                done(error);
            }
        });
    });
});
