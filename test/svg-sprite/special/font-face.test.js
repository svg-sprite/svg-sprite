const path = require('path');
const SVGSpriter = require('../../../lib/svg-sprite.js');
const { paths } = require('../../helpers/constants.js');

describe('testing font face preserving', () => {
    it('preserve font-face in sprite', async() => {
        expect.hasAssertions();

        const TEST_FONT_FACE = '@font-face{font-family:Montserrat-SemiBold;src:url() format(\'woff\');font-weight:600;font-style:normal;font-display:swap}';
        const spriter = new SVGSpriter({
            dest: '.',
            shape: {
                transform: []
            }
        });
        spriter.add(
            path.resolve(path.join(paths.fixtures, 'svg/special/font-face.svg')),
            'font-face.svg',
            `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 45.06 13.7">
                <defs>
                    <style>
                        .cls-4{fill:#fff;border:1px}
                        .d{fill:red}
                        ${TEST_FONT_FACE}
                    </style>
                </defs>
                <text font-family="Montserrat-SemiBold"
                      font-weight="600">Google Play
                </text>
            </svg>`
        );
        const { result } = await spriter.compileAsync({
            symbol: {
                sprite: 'svg/font-face.svg'
            }
        });

        expect(result.symbol.sprite.contents.toString().trim()).toContain(
            TEST_FONT_FACE
        );
    });
});
