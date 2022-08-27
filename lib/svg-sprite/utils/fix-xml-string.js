'use strict';

const { DOMParser } = require('@xmldom/xmldom');
const XmlFixingError = require('../errors/xml-fixing-error.js');

/**
 * @param {string} svgString    svg string to fix
 * @returns {string}            fixed svg string
 */
module.exports = svgString => {
    let domParserError = false;
    const errorHandler = () => {
        domParserError = true;
    };

    const fixedSVG = new DOMParser({ errorHandler })
        .parseFromString(svgString)
        .toString()
        .replace(/(\s)(\s+)/g, ' ');

    if (!domParserError) {
        return fixedSVG;
    }

    throw new XmlFixingError('Invalid XML string');
};
