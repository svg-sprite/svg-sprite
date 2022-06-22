'use strict';

const path = require('path');
const fs = require('fs').promises;
const mustache = require('mustache');
const SVGSpriter = require('../../../../lib/svg-sprite.js');
const { addFixtureFiles } = require('../../../helpers/add-files.js');
const writeFiles = require('../../../helpers/write-files.js');
const writeFile = require('../../../helpers/write-file.js');
const { constants } = require('../../../helpers/test-configs.js');
const { paths } = require('../../../helpers/constants.js');
const removeTmpPath = require('../../../helpers/remove-temp-path.js');

describe.each`
        name          | testConfigKey
        ${'default'}  | ${'DEFAULT'}
        ${'w/o dims'} | ${'WITHOUT_DIMS'}
`('svg-sprite: $name: «symbol» mode', ({ testConfigKey }) => {
    const testConfig = constants[testConfigKey];

    const tmpPath = path.join(paths.tmp, `symbol${testConfig.namespace}`);

    let svg;
    let spriter;
    let data;

    beforeAll(async() => {
        await removeTmpPath(tmpPath);
        data = {};

        spriter = new SVGSpriter({ dest: tmpPath });
        addFixtureFiles(spriter, testConfig.files, testConfig.cwd);
        const { result, data: cssData } = await spriter.compileAsync({
            symbol: {
                sprite: `svg/symbol${testConfig.namespace}.svg`, render: {
                    css: true
                }
            }
        });
        writeFiles(result);
        data = cssData.symbol;
        svg = path.basename(result.symbol.sprite.path);
    });

    it('creates a visually correct stylesheet resource in CSS format', async() => {
        expect.hasAssertions();

        const svgData = await fs.readFile(path.join(tmpPath, 'symbol/svg', svg));

        data.svg = svgData.toString();
        data.css = '../sprite.css';

        expect(data.svg).toMatchSnapshot();

        const previewTemplate = await fs.readFile(path.join(__dirname, '../../../tmpl/symbol.html'), 'utf8');
        const out = mustache.render(previewTemplate, data);
        const preview = await writeFile(path.join(tmpPath, 'symbol/html/symbol.html'), out);
        const expected = path.join(paths.expectations, `png/symbol.html${testConfig.namespace}.png`);

        await expect(preview).toBeVisuallyCorrectAsHTMLTo(expected);
    });
});
