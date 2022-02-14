const assert = require('assert').strict;
const fixXMLString = require('../lib/svg-sprite/fix-xml-string.js');

describe('testing fixing svg string', () => {
    it('should return valid svg file on svg with multiline attribute values', () => {
        assert.equal(fixXMLString(`<svg viewBox="0 0 0 16
                                     16"></svg>`), '<svg viewBox="0 0 0 16 16"/>');
    });

    it('should return valid svg file on svg with multiline attribute values', () => {
        assert.equal(fixXMLString(`<svg fill="r
                                                            e
                                                            d"
                                                            viewBox="0 0 0 16
                                                                                                 16"></svg>`),
        '<svg fill="r e d" viewBox="0 0 0 16 16"/>');
    });

    it('should return valid svg file on svg with multiline attribute values', () => {
        assert.equal(fixXMLString(`<svg fill="r
                                                            e
                                                            d"
                                                            viewBox="0
                                                            0
                                                            16
                                                            16"></svg>`),
        '<svg fill="r e d" viewBox="0 0 16 16"/>');
    });

    it('should throw an error on invalid file', () => {
        assert.throws(() => {
            fixXMLString('<svg viewBox=></svg>');
        }, Error);
    });

    it('should return same string on valid svg', () => {
        assert.equal(fixXMLString('<svg viewBox="0 0 0 16 16"></svg>'), '<svg viewBox="0 0 0 16 16"/>');
    });
});
