'use strict';

const SVGSpriteCssPacker = require('../../../lib/svg-sprite/mode/css/packer.js');

describe('testing SVGSpriteCssPacker', () => {
    describe('testing constructor', () => {
        it('should set initial values', () => {
            expect.hasAssertions();

            const packer = new SVGSpriteCssPacker([]);

            expect(packer.shapes).toStrictEqual([]);
            expect(packer.positions).toStrictEqual([]);
            expect(packer.blocks).toStrictEqual([]);
            expect(packer.root).toStrictEqual({ x: 0, y: 0, width: 0, height: 0 });
        });

        it('should set blocks and positions and ignore master shape', () => {
            expect.hasAssertions();

            const TEST_SHAPES = [
                {
                    master: false,
                    getDimensions: jest.fn().mockReturnValueOnce({ height: 0, width: 5 })
                },
                {
                    master: false,
                    getDimensions: jest.fn().mockReturnValueOnce({ height: 5, width: 0 })
                },
                {
                    master: false,
                    getDimensions: jest.fn().mockReturnValueOnce({ height: 6, width: 0 })
                },
                {
                    master: false,
                    getDimensions: jest.fn().mockReturnValueOnce({ height: 0, width: 6 })
                },
                {
                    master: true,
                    getDimensions: jest.fn()
                }
            ];

            const packer = new SVGSpriteCssPacker(TEST_SHAPES);

            expect(packer.shapes).toBe(TEST_SHAPES);
            expect(packer.positions).toStrictEqual(TEST_SHAPES.map(() => ({ x: 0, y: 0 })));
            expect(packer.blocks).toStrictEqual([
                { height: 6, index: 2, width: 0 },
                {
                    height: 0,
                    index: 3,
                    width: 6
                },
                { height: 0, index: 0, width: 5 },
                { height: 5, index: 1, width: 0 }
            ]);
            expect(packer.root).toStrictEqual({ x: 0, y: 0, width: 0, height: 0 });
        });
    });

    describe('testing _findNode', () => {
        describe('if root is not used', () => {
            it('should return root if both width and height is less than root ones', () => {
                expect.hasAssertions();

                const packer = new SVGSpriteCssPacker([]);
                const TEST_ROOT = { width: 10, height: 10 };

                expect(packer._findNode(TEST_ROOT, 5, 5)).toBe(TEST_ROOT);
            });

            it('should return null if both width or height is greater than root ones (width case)', () => {
                expect.hasAssertions();

                const packer = new SVGSpriteCssPacker([]);
                const TEST_ROOT = { width: 10, height: 10 };

                expect(packer._findNode(TEST_ROOT, 15, 5)).toBeNull();
            });

            it('should return null if both width or height is greater than root ones (height case)', () => {
                expect.hasAssertions();

                const packer = new SVGSpriteCssPacker([]);
                const TEST_ROOT = { width: 10, height: 10 };

                expect(packer._findNode(TEST_ROOT, 5, 15)).toBeNull();
            });
        });

        describe('if root is used', () => {
            it('should return the result of _findNode with root.right', () => {
                expect.hasAssertions();

                const packer = new SVGSpriteCssPacker([]);
                const originalFn = packer._findNode.bind(packer);
                const RESULT = { result: 'test' };
                const TEST_ROOT = {
                    used: true,
                    right: {
                        TEST: 1
                    }
                };

                jest.spyOn(packer, '_findNode').mockReturnValueOnce(RESULT);

                expect(originalFn(TEST_ROOT, 10, 20)).toBe(RESULT);
                expect(packer._findNode).toHaveBeenCalledTimes(1);
                expect(packer._findNode).toHaveBeenCalledWith(TEST_ROOT.right, 10, 20);
            });

            it('should return the result of _findNode with root.down if the result of _findNode, called with root.right returns falsy result', () => {
                expect.hasAssertions();

                const packer = new SVGSpriteCssPacker([]);
                const originalFn = packer._findNode.bind(packer);
                const RESULT = { result: 'test' };
                const TEST_ROOT = {
                    used: true,
                    right: {
                        TEST: 2
                    },
                    down: {
                        TEST: 1
                    }
                };

                jest.spyOn(packer, '_findNode').mockReturnValueOnce(null).mockReturnValueOnce(RESULT);

                expect(originalFn(TEST_ROOT, 20, 10)).toBe(RESULT);
                expect(packer._findNode).toHaveBeenCalledTimes(2);
                expect(packer._findNode).toHaveBeenLastCalledWith(TEST_ROOT.down, 20, 10);
            });
        });
    });

    describe('testing _splitNode()', () => {
        it('should modify and return new node', () => {
            expect.hasAssertions();

            const TEST_NODE = {
                x: 0,
                y: 0,
                width: 100,
                height: 100
            };
            const TEST_NODE_COPY = { ...TEST_NODE };
            const packer = new SVGSpriteCssPacker([]);
            const expected = {
                used: true,
                down: {
                    x: 0,
                    y: 50,
                    width: 100,
                    height: 50
                },
                right: {
                    x: 50,
                    y: 0,
                    width: 50,
                    height: 50
                }
            };

            expect(packer._splitNode(TEST_NODE_COPY, 50, 50)).toStrictEqual({ ...TEST_NODE, ...expected });
            expect(TEST_NODE_COPY).toStrictEqual(expect.objectContaining(expected));
        });
    });

    describe('testing _growRight()', () => {
        it('should get node from _findNode and _splitNode it', () => {
            expect.hasAssertions();

            const packer = new SVGSpriteCssPacker([]);
            const TEST_WIDTH = 50;
            const TEST_HEIGHT = 100;
            const expected = {
                used: true,
                x: 0,
                y: 0,
                width: packer.root.width + TEST_WIDTH,
                height: packer.root.height,
                down: packer.root,
                right: { x: packer.root.width, y: 0, width: TEST_WIDTH, height: packer.root.height }
            };
            const TEST_RESULT = { TEST: 'result' };

            jest.spyOn(packer, '_findNode').mockReturnValueOnce({});
            jest.spyOn(packer, '_splitNode').mockReturnValueOnce(TEST_RESULT);

            expect(packer._growRight(TEST_WIDTH, TEST_HEIGHT)).toBe(TEST_RESULT);
            expect(packer._findNode).toHaveBeenCalledWith(expected, TEST_WIDTH, TEST_HEIGHT);
            expect(packer._splitNode).toHaveBeenLastCalledWith({}, TEST_WIDTH, TEST_HEIGHT);
        });

        it('should return false if node is not found', () => {
            expect.hasAssertions();

            const packer = new SVGSpriteCssPacker([]);

            jest.spyOn(packer, '_findNode').mockReturnValueOnce(null);

            expect(packer._growRight(0, 0)).toBe(false);
        });
    });

    describe('testing _growBottom()', () => {
        it('should get node from _findNode and _splitNode it', () => {
            expect.hasAssertions();

            const packer = new SVGSpriteCssPacker([]);
            const TEST_WIDTH = 50;
            const TEST_HEIGHT = 100;
            const expected = {
                used: true,
                x: 0,
                y: 0,
                width: packer.root.width,
                height: packer.root.height + TEST_HEIGHT,
                down: { x: 0, y: packer.root.height, width: packer.root.width, height: TEST_HEIGHT },
                right: packer.root
            };
            const TEST_RESULT = { TEST: 'result' };

            jest.spyOn(packer, '_findNode').mockReturnValueOnce({});
            jest.spyOn(packer, '_splitNode').mockReturnValueOnce(TEST_RESULT);

            expect(packer._growBottom(TEST_WIDTH, TEST_HEIGHT)).toBe(TEST_RESULT);
            expect(packer._findNode).toHaveBeenCalledWith(expected, TEST_WIDTH, TEST_HEIGHT);
            expect(packer._splitNode).toHaveBeenLastCalledWith({}, TEST_WIDTH, TEST_HEIGHT);
        });

        it('should return null if node is not found', () => {
            expect.hasAssertions();

            const packer = new SVGSpriteCssPacker([]);

            jest.spyOn(packer, '_findNode').mockReturnValueOnce(null);

            expect(packer._growBottom(0, 0)).toBeNull();
        });
    });

    describe('testing _growNode()', () => {
        it.each`
            rootWidth | rootHeight | width | height | fnToCall         | fnNotToCall
            ${10}     | ${100}     | ${10} | ${100} | ${'_growRight'}  | ${'_growBottom'}
            ${100}    | ${100}     | ${10} | ${100} | ${'_growRight'}  | ${'_growBottom'}
            ${10}     | ${1}       | ${10} | ${1}   | ${'_growBottom'} | ${'_growRight'}
            ${10}     | ${1}       | ${10} | ${100} | ${'_growBottom'} | ${'_growRight'}
        `(
            'should call $fnToCall() and not call $fnNotToCall for params: width=$width, height=$height, root={width: $rootWidth, height: $rootHeight}',
            ({ rootWidth, rootHeight, width, height, fnToCall, fnNotToCall }) => {
                expect.hasAssertions();

                const packer = new SVGSpriteCssPacker([]);
                Object.assign(packer.root, {
                    width: rootWidth,
                    height: rootHeight
                });

                const TEST_RESULT = {};

                jest.spyOn(packer, fnToCall).mockReturnValueOnce(TEST_RESULT);
                jest.spyOn(packer, fnNotToCall);

                expect(packer._growNode(width, height)).toBe(TEST_RESULT);
                expect(packer[fnToCall]).toHaveBeenCalledWith(width, height);
                expect(packer[fnNotToCall]).not.toHaveBeenCalled();
            }
        );

        it('should return null and not call _growRight() or _growBottom() if width and height is greater than the root`s ones', () => {
            expect.hasAssertions();

            const packer = new SVGSpriteCssPacker([]);
            Object.assign(packer.root, {
                width: 10,
                height: 10
            });

            jest.spyOn(packer, '_growBottom');
            jest.spyOn(packer, '_growRight');

            expect(packer._growNode(100, 100)).toBeNull();
            expect(packer._growBottom).not.toHaveBeenCalled();
            expect(packer._growRight).not.toHaveBeenCalled();
        });
    });

    describe('testing fit()', () => {
        it('should set root with dimensions of the first block', () => {
            expect.hasAssertions();

            const packer = new SVGSpriteCssPacker([]);
            packer.blocks = [{ width: 100, height: 200 }];
            packer.fit();

            expect(packer.root.width).toBe(100);
            expect(packer.root.height).toBe(200);
        });

        it('should set root with zero dimensions blocks are empty', () => {
            expect.hasAssertions();

            const packer = new SVGSpriteCssPacker([]);
            packer.fit();

            expect(packer.root.width).toBe(0);
            expect(packer.root.height).toBe(0);
        });

        it('should set positions and split node if node is found', () => {
            expect.hasAssertions();

            const TEST_NODE = { x: 1, y: 1 };
            const packer = new SVGSpriteCssPacker([]);
            packer.blocks = [{ width: 100, height: 200, index: 0 }];
            jest.spyOn(packer, '_findNode').mockReturnValueOnce({});
            jest.spyOn(packer, '_splitNode').mockReturnValueOnce(TEST_NODE);
            jest.spyOn(packer, '_growNode');

            packer.fit();

            expect(packer.positions).toHaveLength(1);
            expect(packer.positions[0]).toStrictEqual(TEST_NODE);
            expect(packer._growNode).not.toHaveBeenCalled();
        });

        it('should set positions and grow node if node is not found', () => {
            expect.hasAssertions();

            const TEST_NODE = { x: 1, y: 1 };
            const packer = new SVGSpriteCssPacker([]);
            packer.blocks = [{ width: 100, height: 200, index: 0 }];
            jest.spyOn(packer, '_findNode').mockReturnValueOnce(null);
            jest.spyOn(packer, '_growNode').mockReturnValueOnce(TEST_NODE);
            jest.spyOn(packer, '_splitNode');

            packer.fit();

            expect(packer.positions).toHaveLength(1);
            expect(packer.positions[0]).toStrictEqual(TEST_NODE);
            expect(packer._splitNode).not.toHaveBeenCalled();
        });
    });
});
