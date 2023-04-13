'use strict';

const { mkdir, readFile, writeFile } = require('node:fs').promises;
const path = require('node:path');
const { PNG } = require('pngjs');
const pixelmatch = require('pixelmatch');

const MAX_MISMATCH = 5;

/**
 * @param {PNG}    diff     Diff PNG
 * @param {string} filePath Where to store the diff
 */
const storeDiff = async (diff, filePath) => {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, PNG.sync.write(diff));
};

/**
 * @param   {string}                                                                  input    Input png
 * @param   {string}                                                                  expected Expected png
 *
 * @returns {Promise<{ isEqual: boolean; matched: number | any; diff: exports.PNG }>}          Matching results
 */
module.exports = async (input, expected) => {
  const inputPng = PNG.sync.read(await readFile(input));
  const expectedPng = PNG.sync.read(await readFile(expected));

  const { width, height } = inputPng;

  const diff = new PNG({ width, height });

  const matched = pixelmatch(inputPng.data, expectedPng.data, diff.data, width, height, { threshold: 0.1 });

  if (matched <= MAX_MISMATCH) {
    return { isEqual: true, matched, diff };
  }

  await storeDiff(diff, path.join(path.dirname(input), path.basename(input).replace('.png', '.diff.png')));

  return { isEqual: false, matched, diff };
};
