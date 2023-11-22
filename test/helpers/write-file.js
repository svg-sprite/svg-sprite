'use strict';

const { mkdir, writeFile } = require('node:fs/promises');
const path = require('node:path');

/**
 * Prepare and output a file and create directories as necessary
 *
 * @param {string} file               File
 * @param {string} content            Content
 * @returns {string}                  File
 */
module.exports = async(file, content) => {
  try {
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, content);
    return file;
  } catch {
    return null;
  }
};
