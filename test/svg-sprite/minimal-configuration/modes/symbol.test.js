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

        const previewTemplate = await fs.readFile(path.join(__dirname, '../../../tmpl/symbol.html'), 'utf-8');
        const out = mustache.render(previewTemplate, data);
        const preview = await writeFile(path.join(tmpPath, 'symbol/html/symbol.html'), out);
        const expected = path.join(paths.expectations, `png/symbol.html${testConfig.namespace}.png`);

        await expect(preview).toBeVisuallyCorrectAsHTMLTo(expected);
    });
});

describe('testing width and height setting', () => {
    const tmpPath = path.join(paths.tmp, 'symbol.width');

    let spriter;
    let data;

    it('should set width and height if dimensions are set to true', async() => {
        await removeTmpPath(tmpPath);
        data = {};

        spriter = new SVGSpriter({
            dest: tmpPath
        });
        spriter.add('svg.svg', null, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 34 20" width="34" height="20">
\t<path d="M4 0l13 12.978L30.008 0l4 4-17 17-17-17z" fill="white" />
</svg>`);
        const { result } = await spriter.compileAsync({
            symbol: true,
            shape: {
                dimension: {
                    attributes: true
                }
            },
            svg: {
                dimensionAttributes: true
            }
        });

        expect(result.symbol.sprite.contents.toString()).toContain('width="34"');
        expect(result.symbol.sprite.contents.toString()).toContain('height="20"');
    });
});
