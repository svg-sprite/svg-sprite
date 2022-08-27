'use strict';

const xpath = require('xpath');
const SVGShape = require('../../../lib/svg-sprite/shape.js');
const NotPermittedError = require('../../../lib/svg-sprite/errors/not-permitted-error.js');

const TEST_SPRITER = {
    config: {
        shape: {
            meta: {},
            align: {}
        },
        svg: {
            doctypeDeclaration: ''
        }
    },
    verbose: jest.fn()
};
const TEST_FILE = {
    contents: '<svg></svg>',
    path: 'test_path',
    relative: 'test_relative'
};
jest.mock('xpath');
jest.mock('csso', () => {
    return {
        minifyBlock: jest.fn().mockReturnValue({ css: '' })
    };
});

describe('testing setNamespace()', () => {
    /**
     * @param {boolean} addNamespaceIds         shape.spriter.config.svg.namespaceIDs
     * @param {boolean} isNamespaced            shape._namespaced
     * @param {boolean} addNamespaceClassnames  shape.spriter.config.svg.namespaceClassnames
     * @returns {object}                        SVGShape
     */
    const createShape = (addNamespaceIds, isNamespaced, addNamespaceClassnames) => {
        const shape = new SVGShape(TEST_FILE, TEST_SPRITER);

        shape.spriter.config.svg.namespaceIDs = addNamespaceIds;
        shape.spriter.config.svg.namespaceClassnames = addNamespaceClassnames;
        shape._namespaced = isNamespaced;
        shape.svg.ready = '<svg/>';
        return shape;
    };

    it('should raise error if shape is not ready', () => {
        expect.hasAssertions();

        const shape = createShape(true, false, true);
        shape.svg.ready = false;

        expect(() => {
            shape.setNamespace({});
        }).toThrow(new NotPermittedError('Shape namespace cannot be set before complementing'));
    });

    describe('if namespaceIds', () => {
        it('should call multiple xpath.select and set attributes', () => {
            expect.hasAssertions();

            const shape = createShape(true, false, false);
            jest.spyOn(shape, '_replaceIdAndClassnameReferences').mockImplementation().mockReturnValue('');
            const TEST_NAMESPACE = 'test-namespace';
            const TEST_ATTR_VALUE = 'id';

            const FIRST_ELEMENTS = [{
                getAttribute: jest.fn().mockReturnValueOnce(TEST_ATTR_VALUE),
                setAttribute: jest.fn()
            }];
            const SECOND_ELEMENTS = [{
                nodeValue: 'data:'
            }, {
                nodeValue: `#${TEST_ATTR_VALUE}`,
                ownerElement: {
                    setAttribute: jest.fn()
                }
            }];
            const THIRD_ELEMENTS = [{
                nodeValue: 'data:'
            }, {
                nodeValue: `#${TEST_ATTR_VALUE}`,
                ownerElement: {
                    setAttribute: jest.fn()
                }
            }];
            const FOURTH_ELEMENTS = [{
                localName: 'TEST local name',
                ownerElement: {
                    setAttribute: jest.fn()
                }
            }];

            const SIXTH_ELEMENTS = [{
                ownerElement: { setAttribute: jest.fn() }
            }];
            const mockSelect = jest.fn().mockReturnValueOnce(FIRST_ELEMENTS).mockReturnValueOnce(SECOND_ELEMENTS).mockReturnValueOnce(THIRD_ELEMENTS).mockReturnValueOnce(FOURTH_ELEMENTS).mockReturnValue(SIXTH_ELEMENTS);

            const mockMinifyBlock = jest.fn().mockReturnValue({ css: '' });

            jest.doMock('csso', () => {
                return {
                    minifyBlock: mockMinifyBlock
                };
            });
            jest.spyOn(xpath, 'useNamespaces').mockReturnValueOnce(mockSelect);

            shape.setNamespace(TEST_NAMESPACE);

            expect(mockSelect).toHaveBeenCalledTimes(14);
            expect(mockSelect.mock.calls[0][0]).toBe('//*[@id]');
            expect(mockSelect.mock.calls[1][0]).toBe('//@xlink:href');
            expect(mockSelect.mock.calls[2][0]).toBe('//@href');

            ['style', 'fill', 'stroke', 'filter', 'clip-path', 'mask', 'marker-start', 'marker-end', 'marker-mid'].forEach((ref, i) => {
                expect(mockSelect.mock.calls[3 + i][0]).toBe(`//@${ref}`);
            });

            expect(mockSelect.mock.calls[12][0]).toBe('//svg:style');
            expect(mockSelect.mock.calls[13][0]).toBe('//svg:style');

            expect(FIRST_ELEMENTS[0].setAttribute).toHaveBeenCalledWith('id', `${TEST_NAMESPACE}${TEST_ATTR_VALUE}`);
            expect(SECOND_ELEMENTS[1].ownerElement.setAttribute).toHaveBeenCalledWith('xlink:href', `#${TEST_NAMESPACE}${TEST_ATTR_VALUE}`);
            expect(THIRD_ELEMENTS[1].ownerElement.setAttribute).toHaveBeenCalledWith('href', `#${TEST_NAMESPACE}${TEST_ATTR_VALUE}`);
            expect(FOURTH_ELEMENTS[0].ownerElement.setAttribute).toHaveBeenCalledWith(FOURTH_ELEMENTS[0].localName, '');
            expect(shape._namespaced).toBe(true);

            expect(mockMinifyBlock).toHaveBeenCalledWith('', { restructure: false });
        });

        it('should set aria-labelledby', () => {
            expect.hasAssertions();

            const shape = createShape(true, false, false);
            jest.spyOn(shape, '_replaceIdAndClassnameReferences').mockImplementation();
            const TEST_ATTR_VALUE = 'id';
            const TEST_NAMESPACE = 'test-namespace';

            const FIRST_ELEMENTS = [{
                getAttribute: jest.fn().mockReturnValueOnce(TEST_ATTR_VALUE),
                setAttribute: jest.fn()
            }];

            jest.spyOn(shape.dom.documentElement, 'hasAttribute').mockImplementation().mockReturnValueOnce(true);
            jest.spyOn(shape.dom.documentElement, 'getAttribute').mockImplementation().mockReturnValueOnce(`${TEST_ATTR_VALUE} test`);
            jest.spyOn(shape.dom.documentElement, 'setAttribute').mockImplementation();
            jest.spyOn(xpath, 'useNamespaces').mockReturnValueOnce(jest.fn().mockReturnValueOnce(FIRST_ELEMENTS).mockReturnValue([]));

            shape.setNamespace(TEST_NAMESPACE);

            expect(shape.dom.documentElement.setAttribute).toHaveBeenCalledWith('aria-labelledby', `${TEST_NAMESPACE}${TEST_ATTR_VALUE} test`);
        });
    });

    describe('with namespaceClassnames', () => {
        it('should call xpath.select with //*[@class]', () => {
            expect.hasAssertions();

            const shape = createShape(false, false, true);
            jest.spyOn(shape, '_replaceIdAndClassnameReferences').mockImplementation();
            const TEST_ELEMENTS = [{
                getAttribute: jest.fn().mockReturnValueOnce('1 2 3 4 5  6 '),
                setAttribute: jest.fn()
            }];
            const TEST_NAMESPACE = 'ns';

            const mockSelect = jest.fn().mockReturnValueOnce(TEST_ELEMENTS).mockReturnValueOnce([]);

            jest.spyOn(xpath, 'useNamespaces').mockReturnValueOnce(mockSelect);

            shape.setNamespace(TEST_NAMESPACE);

            expect(mockSelect).toHaveBeenCalledWith('//*[@class]', shape.dom);
            expect(TEST_ELEMENTS[0].setAttribute).toHaveBeenCalledWith('class', `${TEST_NAMESPACE}1 ${TEST_NAMESPACE}2 ${TEST_NAMESPACE}3 ${TEST_NAMESPACE}4 ${TEST_NAMESPACE}5 ${TEST_NAMESPACE}6`);
            expect(shape._namespaced).toBe(true);
        });
    });

    it('should not call anything if already namespaced', () => {
        expect.hasAssertions();

        const shape = createShape(true, true, true);
        jest.spyOn(xpath, 'useNamespaces');

        shape.setNamespace('123');

        expect(xpath.useNamespaces).not.toHaveBeenCalled();
    });

    it('should not call anything if shape has no namespaceIds and namespaceClassnames', () => {
        expect.hasAssertions();

        const shape = createShape(false, false, false);
        jest.spyOn(xpath, 'useNamespaces');

        shape.setNamespace('123');

        expect(xpath.useNamespaces).not.toHaveBeenCalled();
    });
});

describe('testing resetNamespace()', () => {
    it('should not change _namespaced if it is already not namespaced', () => {
        expect.hasAssertions();

        const shape = new SVGShape(TEST_FILE, TEST_SPRITER);
        shape._namespaced = false;
        shape.resetNamespace();

        expect(shape._namespaced).toBe(false);
    });

    it('should not change _namespaced if this.spriter.config.svg.namespaceIDs is falsy', () => {
        expect.hasAssertions();

        const shape = new SVGShape(TEST_FILE, TEST_SPRITER);
        shape.spriter.config.svg.namespaceIDs = false;
        shape._namespaced = true;
        shape.resetNamespace();

        expect(shape._namespaced).toBe(true);
    });

    it('should change _namespaced if it is namespaced and this.spriter.config.svg.namespaceIDs is truthy', () => {
        expect.hasAssertions();

        const shape = new SVGShape(TEST_FILE, TEST_SPRITER);
        shape.spriter.config.svg.namespaceIDs = true;
        shape._namespaced = true;
        shape.svg.ready = TEST_FILE.contents;
        shape.resetNamespace();

        expect(shape._namespaced).toBe(false);
    });
});
