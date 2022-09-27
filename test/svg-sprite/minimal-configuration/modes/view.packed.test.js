'use strict';

const path = require('path');
const fs = require('fs').promises;
const mustache = require('mustache');
const writeFiles = require('../../../helpers/write-files.js');
const writeFile = require('../../../helpers/write-file.js');
const SVGSpriter = require('../../../../lib/svg-sprite.js');
const { addFixtureFiles } = require('../../../helpers/add-files.js');
const { paths } = require('../../../helpers/constants.js');
const removeTmpPath = require('../../../helpers/remove-temp-path.js');
const { constants } = require('../../../helpers/test-configs.js');

describe.each`
        name          | testConfigKey
        ${'default'}  | ${'DEFAULT'}
        ${'w/o dims'} | ${'WITHOUT_DIMS'}
`('svg-sprite: $name: «symbol» mode', ({ testConfigKey }) => {
    const testConfig = constants[testConfigKey];

    const tmpPath = path.join(paths.tmp, `view${testConfig.namespace}.packed`);
    let spriter;
    let svg;
    let data;

    beforeAll(removeTmpPath.bind(null, tmpPath));

    // Test the view mode
    describe(`svg-sprite: ${testConfig.name} in «view» mode`, () => {
        beforeAll(async() => {
            data = {};
            spriter = new SVGSpriter({ dest: tmpPath });
            addFixtureFiles(spriter, testConfig.files, testConfig.cwd);
            const { result, data: cssData } = await spriter.compileAsync({
                view: {
                    sprite: `svg/view.packed${testConfig.namespace}.svg`,
                    layout: 'packed',
                    dimensions: '-dims',
                    render: {
                        css: true
                    }
                }
            });
            writeFiles(result);
            data = cssData.view;
            svg = path.basename(result.view.sprite.path);
        });

        // Packed layout
        it('creates visually correct sprite with packed layout', async() => {
            expect.hasAssertions();

            const input = path.join(tmpPath, 'view/svg', svg);
            const expected = path.join(paths.expectations, `png/css.packed${testConfig.namespace}.png`);
            const svgFile = await fs.readFile(input);

            expect(svgFile.toString()).toMatchSnapshot();
            await expect(input).toBeVisuallyEqualTo(expected);
        });

        it('creates a visually correct stylesheet resource in CSS format', async() => {
            expect.hasAssertions();

            data.css = '../sprite.css';

            const previewTemplate = await fs.readFile(path.join(__dirname, '../../../tmpl/view.html'), 'utf8');
            const out = mustache.render(previewTemplate, data);
            const preview = await writeFile(path.join(tmpPath, 'view/html/view.html'), out);
            const expected = path.join(paths.expectations, `png/view.html${testConfig.namespace}.png`);

            await expect(preview).toBeVisuallyCorrectAsHTMLTo(expected);
        });
    });
});
