'use strict';

/* eslint-disable no-unused-expressions, max-nested-callbacks */

const path = require('path');
const fs = require('fs');
const mustache = require('mustache');
const should = require('should');
const looksSame = require('looks-same');
const SVGSpriter = require('../../../../lib/svg-sprite.js');
const { addFixtureFiles } = require('../../../helpers/add-files.js');
const writeFiles = require('../../../helpers/write-files.js');
const writeFile = require('../../../helpers/write-file.js');
const capturePuppeteer = require('../../../helpers/capture-puppeteer.js');
const testConfigs = require('../../../helpers/test-configs.js');
const { paths } = require('../../../helpers/constants.js');

const removeTmpPath = require('../../../helpers/remove-temp-path.js');

testConfigs.forEach(testConfig => {
    describe(`svg-sprite: ${testConfig.name}: in «symbol» mode`, () => {
        before(removeTmpPath);

        let svg;
        let data = {};
        let spriter;
        before('creates 2 files for packed layout', done => {
            spriter = new SVGSpriter({
                dest: paths.tmp
            });
            addFixtureFiles(spriter, testConfig.files, testConfig.cwd);
            spriter.compile({
                symbol: {
                    sprite: `svg/symbol${testConfig.namespace}.svg`,
                    render: {
                        css: true
                    }
                }
            }, (error, result, cssData) => {
                writeFiles(result).should.be.exactly(2);
                data = cssData.symbol;
                svg = path.basename(result.symbol.sprite.path);
                done();
            });
        });

        it('creates a visually correct stylesheet resource in CSS format', done => {
            data.svg = fs.readFileSync(path.join(paths.tmp, 'symbol/svg', svg)).toString();
            data.css = '../sprite.css';
            const previewTemplate = fs.readFileSync(path.join(__dirname, '../../../tmpl/symbol.html'), 'utf-8');
            const out = mustache.render(previewTemplate, data);
            const preview = writeFile(path.join(paths.tmp, 'symbol/html/symbol.html'), out);
            const previewImage = path.join(paths.tmp, `symbol/symbol.html${testConfig.namespace}.png`);
            preview.should.be.ok;

            capturePuppeteer(preview, previewImage, error => {
                should(error).not.ok;
                if (error) {
                    return done(error);
                }

                looksSame(
                    previewImage,
                    path.join(paths.expectations, `png/symbol.html${testConfig.namespace}.png`),
                    (error, result) => {
                        should(error).not.ok;
                        should.ok(result.equal, 'The generated CSS preview doesn\'t match the expected one!');
                        done();
                    });
            });
        });
    });
});
