'use strict';

const { readFile, writeFile } = require('fs').promises;
const resvg = require('@resvg/resvg-js');

async function convertSvg2Png(svgPath, pngPath) {
    try {
        const svg = await readFile(svgPath);
        const pngData = await resvg.renderAsync(svg, {
            fitTo: { mode: 'original' }
        });

        await writeFile(pngPath, pngData);
    } catch (error) {
        const e = new Error(error);
        e.name = 'ConvertError';
        e.errno = 1_400_444_333;
        throw e;
    }
}

module.exports = convertSvg2Png;
