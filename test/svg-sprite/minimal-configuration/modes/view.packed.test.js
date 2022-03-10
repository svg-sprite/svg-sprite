'use strict';

/* eslint-disable no-unused-expressions, max-nested-callbacks */
const path = require('path');
const fs = require('fs');
const mustache = require('mustache');
const should = require('should');
const looksSame = require('looks-same');
const writeFiles = require('../../../helpers/write-files.js');
const compareSvg2Png = require('../../../helpers/compare-svg-2-png.js');
const writeFile = require('../../../helpers/write-file.js');
const capturePuppeteer = require('../../../helpers/capture-puppeteer.js');
const testConfigs = require('../../../helpers/test-configs.js');
const SVGSpriter = require('../../../../lib/svg-sprite.js');
const { addFixtureFiles } = require('../../../helpers/add-files.js');
const { paths } = require('../../../helpers/constants.js');

const removeTmpPath = require('../../../helpers/remove-temp-path.js');

testConfigs.forEach(testConfig => {
    let spriter;
    let svg;
    let data = {};
    // Test the view mode
    describe(`svg-sprite: ${testConfig.name}: in «view» mode`, () => {
        before(removeTmpPath);
        before('creates 2 files for packed layout', done => {
            spriter = new SVGSpriter({
                dest: paths.tmp
            });
            addFixtureFiles(spriter, testConfig.files, testConfig.cwd);
            spriter.compile({
                view: {
                    sprite: `svg/view.packed${testConfig.namespace}.svg`,
                    layout: 'packed',
                    dimensions: '-dims',
                    render: {
                        css: true
                    }
                }
            }, (error, result, cssData) => {
                writeFiles(result);
                data = cssData.view;
                svg = path.basename(result.view.sprite.path);
                done();
            });
        });

        // Packed layout
        it('creates visually correct sprite with packed layout', done => {
            compareSvg2Png(
                path.join(paths.tmp, 'view/svg', svg),
                path.join(paths.tmp, `view/png/view.packed${testConfig.namespace}.png`),
                path.join(paths.expectations, `png/css.packed${testConfig.namespace}.png`),
                path.join(paths.tmp, `view/png/view.packed${testConfig.namespace}.diff.png`),
                done,
                'The packed sprite doesn\'t match the expected one!'
            );
        });

        it('creates a visually correct stylesheet resource in CSS format', done => {
            data.css = '../sprite.css';
            const previewTemplate = fs.readFileSync(path.join(__dirname, '../../../tmpl/view.html'), 'utf-8');
            const out = mustache.render(previewTemplate, data);
            const preview = writeFile(path.join(paths.tmp, 'view/html/view.html'), out);
            const previewImage = path.join(paths.tmp, `view/png/view.html${testConfig.namespace}.png`);
            preview.should.be.ok;

            capturePuppeteer(preview, previewImage, error => {
                should(error).not.ok;
                looksSame(
                    previewImage,
                    path.join(paths.expectations, `png/view.html${testConfig.namespace}.png`),
                    (error, result) => {
                        should(error).not.ok;
                        should.ok(result.equal, 'The generated CSS preview doesn\'t match the expected one!');
                        done();
                    });
            });
        });
    });
});
