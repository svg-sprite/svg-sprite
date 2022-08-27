'use strict';

/* eslint-disable jest/prefer-expect-assertions */

const fixXMLString = require('../lib/svg-sprite/utils/fix-xml-string.js');
const XmlFixingError = require('../lib/svg-sprite/errors/xml-fixing-error.js');

describe('testing fixing svg string', () => {
    it('should return valid svg file on svg with one multiline attribute values', () => {
        expect(fixXMLString(`<svg viewBox="0 0 16
                                     16"></svg>`)).toBe('<svg viewBox="0 0 16 16"/>');
    });

    it('should return valid svg file on svg with few multiline attribute values', () => {
        expect(fixXMLString(`<svg fill="r
                                                            e
                                                            d"
                                                            viewBox="0 0 16
                                                                                                 16"></svg>`)).toBe(
            '<svg fill="r e d" viewBox="0 0 16 16"/>');
    });

    it('should return valid svg file on svg with multiple multiline attribute values', () => {
        expect(fixXMLString(`<svg fill="r
                                                            e
                                                            d"
                                                            viewBox="0
                                                            0
                                                            16
                                                            16"></svg>`)).toBe(
            '<svg fill="r e d" viewBox="0 0 16 16"/>');
    });

    it('should return same string on valid svg', () => {
        expect(fixXMLString('<svg viewBox="0 0 16 16"></svg>')).toBe('<svg viewBox="0 0 16 16"/>');
    });

    it('should throw an error on invalid file', () => {
        expect(() => {
            fixXMLString('<svg viewBox=></svg>');
        }).toThrow(XmlFixingError);
    });
});
