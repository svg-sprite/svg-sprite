'use strict';

const fs = require('fs');
const { paths } = require('./constants.js');

// This is needed so that we don't hit the `fs.rmdir`
// deprecation warnings on Node.js >= 14.14.0
// TODO Drop this when we drop support for Node.js 12
const rm = fs.promises.rm || fs.promises.rmdir;

module.exports = async() => {
    await rm(paths.tmp, { force: true, recursive: true });
};
