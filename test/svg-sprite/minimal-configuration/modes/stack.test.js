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
`('svg-sprite: $name: «stack» mode', ({ testConfigKey }) => {
    const testConfig = constants[testConfigKey];

    const tmpPath = path.join(paths.tmp, `stack${testConfig.namespace}`);

    let svg;
    let spriter;
    let data;

    beforeAll(async() => {
        await removeTmpPath(tmpPath);
        data = {};

        spriter = new SVGSpriter({ dest: tmpPath });
        addFixtureFiles(spriter, testConfig.files, testConfig.cwd);
        const { result, data: cssData } = await spriter.compileAsync({
            stack: {
                sprite: `svg/stack${testConfig.namespace}.svg`, render: {
                    css: true
                }
            }
        });
        writeFiles(result);
        data = cssData.stack;
        svg = path.basename(result.stack.sprite.path);
    });

    it('creates a visually correct stylesheet resource in CSS format', async() => {
        expect.hasAssertions();

        const svgData = await fs.readFile(path.join(tmpPath, 'stack/svg', svg));

        data.svg = svgData.toString();
        data.css = '../sprite.css';

        expect(data.svg).toMatchSnapshot();

        const previewTemplate = await fs.readFile(path.join(__dirname, '../../../tmpl/stack.html'), 'utf8');
        const out = mustache.render(previewTemplate, data);
        const preview = await writeFile(path.join(tmpPath, `stack/html/stack${testConfig.namespace}.html`), out);
        const expected = path.join(paths.expectations, `png/stack${testConfig.namespace}.html.png`);

        await expect(preview).toBeVisuallyCorrectAsHTMLTo(expected);
    });
});

describe('without viewbox', () => {
    const testConfig = constants.WITHOUT_DIMS;
    const tmpPath = path.join(paths.tmp, 'stack-without-viewbox');
    let svg;
    let spriter;
    let data;

    beforeAll(async() => {
        await removeTmpPath(tmpPath);
        data = {};

        spriter = new SVGSpriter({ dest: tmpPath });
        addFixtureFiles(spriter, testConfig.files, testConfig.cwd);
        const { result, data: cssData } = await spriter.compileAsync({
            stack: {
                sprite: `svg/stack${testConfig.namespace}.svg`, render: {
                    css: true
                },
                rootviewbox: false
            }
        });
        writeFiles(result);
        data = cssData.stack;
        svg = path.basename(result.stack.sprite.path);
    });

    it('creates a visually correct stylesheet resource in CSS format', async() => {
        expect.hasAssertions();

        const svgData = await fs.readFile(path.join(tmpPath, 'stack/svg', svg));

        data.svg = svgData.toString();
        data.css = '../sprite.css';

        expect(data.svg).toMatchSnapshot();

        const previewTemplate = await fs.readFile(path.join(__dirname, '../../../tmpl/stack.html'), 'utf8');
        const out = mustache.render(previewTemplate, data);
        const preview = await writeFile(path.join(tmpPath, 'stack/html/stack-without-viewbox.html'), out);
        const expected = path.join(paths.expectations, 'png/stack-without-viewbox.html.png');

        await expect(preview).toBeVisuallyCorrectAsHTMLTo(expected);
    });
});
