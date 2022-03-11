'use strict';

const path = require('path');
const fs = require('fs');
const mustache = require('mustache');
const SVGSpriter = require('../../../../lib/svg-sprite.js');
const { addFixtureFiles } = require('../../../helpers/add-files.js');
const writeFiles = require('../../../helpers/write-files.js');
const writeFile = require('../../../helpers/write-file.js');
const { constants } = require('../../../helpers/test-configs.js');
const { paths } = require('../../../helpers/constants.js');

const removeTmpPath = require('../../../helpers/remove-temp-path.js');

const tmpPath = path.join(paths.tmp, 'symbol');

describe.each`
        name          | testConfigKey
        ${'default'}  | ${'DEFAULT'}
        ${'w/o dims'} | ${'WITHOUT_DIMS'}
`('svg-sprite: $name: «symbol» mode', ({ testConfigKey }) => {
    const testConfig = constants[testConfigKey];

    let svg;
    let spriter;
    let data;

    beforeAll(removeTmpPath.bind(null, tmpPath));

    // eslint-disable-next-line jest/no-done-callback, jest/no-duplicate-hooks
    beforeAll(done => {
        data = {};

        spriter = new SVGSpriter({
            dest: tmpPath
        });
        addFixtureFiles(spriter, testConfig.files, testConfig.cwd);
        spriter.compile({
            symbol: {
                sprite: `svg/symbol${testConfig.namespace}.svg`, render: {
                    css: true
                }
            }
        }, (error, result, cssData) => {
            writeFiles(result);
            data = cssData.symbol;
            svg = path.basename(result.symbol.sprite.path);
            done();
        });
    });

    it('creates a visually correct stylesheet resource in CSS format', async() => {
        expect.hasAssertions();

        data.svg = fs.readFileSync(path.join(tmpPath, 'symbol/svg', svg)).toString();
        data.css = '../sprite.css';
        const previewTemplate = fs.readFileSync(path.join(__dirname, '../../../tmpl/symbol.html'), 'utf-8');
        const out = mustache.render(previewTemplate, data);
        const preview = writeFile(path.join(tmpPath, 'symbol/html/symbol.html'), out);

        await expect(preview).toBeVisuallyCorrectAsHTML(path.join(paths.expectations, `png/symbol.html${testConfig.namespace}.png`));
    });
});
