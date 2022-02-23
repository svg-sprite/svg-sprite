const fixXMLString = require('../lib/svg-sprite/utils/fix-xml-string.js');

describe('testing fixing svg string', () => {
    it('should return valid svg file on svg with one multiline attribute values', () => {
        expect(fixXMLString(`<svg viewBox="0 0 16
                                     16"></svg>`)).toEqual('<svg viewBox="0 0 16 16"/>');
    });

    it('should return valid svg file on svg with few multiline attribute values', () => {
        expect(fixXMLString(`<svg fill="r
                                                            e
                                                            d"
                                                            viewBox="0 0 16
                                                                                                 16"></svg>`)).toEqual(
            '<svg fill="r e d" viewBox="0 0 16 16"/>');
    });

    it('should return valid svg file on svg with multiple multiline attribute values', () => {
        expect(fixXMLString(`<svg fill="r
                                                            e
                                                            d"
                                                            viewBox="0
                                                            0
                                                            16
                                                            16"></svg>`)).toEqual(
            '<svg fill="r e d" viewBox="0 0 16 16"/>');
    });

    it('should return same string on valid svg', () => {
        expect(fixXMLString('<svg viewBox="0 0 16 16"></svg>')).toEqual('<svg viewBox="0 0 16 16"/>');
    });

    it('should throw an error on invalid file', () => {
        expect(() => {
            fixXMLString('<svg viewBox=></svg>');
        }).toThrow(Error);
    });
});
