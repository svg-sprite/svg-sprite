'use strict';

/* eslint-disable no-unused-expressions, max-nested-callbacks */
const path = require('path');
const glob = require('glob');
const should = require('should');
const SVGSpriter = require('../../../lib/svg-sprite.js');
const { addFixtureFiles } = require('../../helpers/add-files.js');
const tmpPath = require('../../helpers/tmp-path.js');

const cwd = path.join(__dirname, '../../fixture/svg/single');
const weather = glob.sync('**/weather*.svg', { cwd });

describe('testing rerun', () => {
    it('creates 5 files and then additional 1 on each layout after rerun when all render types disabled', done => {
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

            should(firstResult.css).be.an.Object;
            should(Object.values(firstResult.css).length).be.exactly(5);

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

                        should(result.css).be.an.Object;
                        should(Object.values(result.css).length).be.exactly(1);
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
