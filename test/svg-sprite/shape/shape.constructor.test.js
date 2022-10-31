'use strict';

/* eslint-disable max-nested-callbacks */

const path = require('path');
const SVGShape = require('../../../lib/svg-sprite/shape.js');

describe('testing Shape.constructor', () => {
    describe('testing constructor', () => {
        const TEST_FILE = {
            contents: '<svg>TEST CONTENT</svg>',
            path: 'test_path',
            relative: 'test_relative'
        };

        it('should set expected initial values', () => {
            expect.hasAssertions();

            const TEST_SPRITER = {
                config: {
                    shape: { meta: {}, align: {} },
                    id: {}
                },
                verbose: jest.fn()
            };
            const shape = new SVGShape(TEST_FILE, TEST_SPRITER);

            expect(shape.spriter).toBe(TEST_SPRITER);
            expect(shape.source).toBe(TEST_FILE);
            expect(shape.name).toBe(path.basename(TEST_FILE.path));
            expect(shape.id).toBe(path.basename(TEST_FILE.path));
            expect(shape.master).toBeNull();
            expect(shape.copies).toBe(0);
            expect(shape._precision).toBe(10 ** 2);
            expect(shape._scale).toBe(1);
            expect(shape._namespaced).toBe(false);
        });

        describe('config', () => {
            it('should set config from passed spriter.config', () => {
                expect.hasAssertions();

                const TEST_SPRITER = {
                    config: {
                        shape: { meta: {}, align: {}, TEST: 1, TEST_2: 2 },
                        id: {}
                    },
                    verbose: jest.fn()
                };
                const shape = new SVGShape(TEST_FILE, TEST_SPRITER);

                expect(shape.config).toStrictEqual(expect.objectContaining({ TEST: 1, TEST_2: 2 }));
            });

            describe('testing generator', () => {
                it('should set default generator if provided generator is not a string', () => {
                    expect.hasAssertions();

                    const TEST_SPRITER = {
                        config: {
                            shape: {
                                id: {
                                    generator: true
                                },
                                meta: {},
                                align: {}
                            }
                        },
                        verbose: jest.fn()
                    };
                    const shape = new SVGShape(TEST_FILE, TEST_SPRITER);

                    expect(shape.config.id.generator(`test${path.sep}test.f.svg`)).toBe('test--test.f');
                    expect(shape.config.id.generator('test 1.svg')).toBe('test_1');
                });

                it('default generator should keep folder names from relative path', () => {
                    expect.hasAssertions();

                    const baseFolder = `${path.sep}my${path.sep}full${path.sep}path`;
                    const fullPath = `${path.sep}my${path.sep}full${path.sep}path${path.sep}folder${path.sep}test_path.f.svg`;
                    const TEST_FILE_WITH_FOLDERS = {
                        contents: '<svg>TEST CONTENT</svg>',
                        base: baseFolder,
                        path: fullPath,
                        relative: path.relative(baseFolder, fullPath) //relative path depends on a base full path to search files
                    };
                    const TEST_SPRITER = {
                        config: {
                            shape: {
                                id: {
                                    generator: true
                                },
                                meta: {},
                                align: {}
                            }
                        },
                        verbose: jest.fn()
                    };
                    const shape = new SVGShape(TEST_FILE_WITH_FOLDERS, TEST_SPRITER);

                    expect(shape.config.id.generator(TEST_FILE_WITH_FOLDERS.relative, TEST_FILE_WITH_FOLDERS)).toBe('folder--test_path.f');
                });

                it('should set generator if provided generator is a string', () => {
                    expect.hasAssertions();

                    const TEST_SPRITER = {
                        config: {
                            shape: {
                                id: {
                                    generator: 'generator'
                                },
                                meta: {},
                                align: {}
                            }
                        },
                        verbose: jest.fn()
                    };
                    const shape = new SVGShape(TEST_FILE, TEST_SPRITER);

                    expect(shape.config.id.generator(`test${path.sep}test.f.svg`)).toBe('generatortest--test.f');
                    expect(shape.config.id.generator('test 1.svg')).toBe('generatortest_1');
                });

                it('should set generator if provided generator is a string with %s', () => {
                    expect.hasAssertions();

                    const TEST_SPRITER = {
                        config: {
                            shape: {
                                id: {
                                    generator: '%s-test'
                                },
                                meta: {},
                                align: {}
                            }
                        },
                        verbose: jest.fn()
                    };
                    const shape = new SVGShape(TEST_FILE, TEST_SPRITER);

                    expect(shape.config.id.generator(`test${path.sep}test.f.svg`)).toBe('test--test.f-test');
                    expect(shape.config.id.generator('test 1.svg')).toBe('test_1-test');
                });

                it('should set generator if provided generator with proper separator', () => {
                    expect.hasAssertions();

                    const TEST_SPRITER = {
                        config: {
                            shape: {
                                id: {
                                    generator: '%s-test',
                                    separator: '!'
                                },
                                meta: {},
                                align: {}
                            }
                        },
                        verbose: jest.fn()
                    };
                    const shape = new SVGShape(TEST_FILE, TEST_SPRITER);

                    expect(shape.config.id.generator(`test${path.sep}test.f.svg`)).toBe('test!test.f-test');
                    expect(shape.config.id.generator('test 1.svg')).toBe('test_1-test');
                });

                it('should set generator if provided generator without proper separator', () => {
                    expect.hasAssertions();

                    const TEST_SPRITER = {
                        config: {
                            shape: {
                                id: {
                                    generator: '%s-test',
                                    separator: false
                                },
                                meta: {},
                                align: {}
                            }
                        },
                        verbose: jest.fn()
                    };
                    const shape = new SVGShape(TEST_FILE, TEST_SPRITER);

                    expect(shape.config.id.generator(`test${path.sep}test.f.svg`)).toBe('test.f-test');
                    expect(shape.config.id.generator('test 1.svg')).toBe('test_1-test');
                });
            });
        });

        describe('testing meta', () => {
            it('should set exact meta if provided meta has generated id', () => {
                expect.hasAssertions();

                const TEST_SPRITER = {
                    config: {
                        shape: {
                            meta: { TEST_ID: 'TEST_META' }, align: {},
                            id: {
                                generator() {
                                    return 'TEST_ID';
                                }
                            }
                        }
                    },
                    verbose: jest.fn()
                };
                const shape = new SVGShape(TEST_FILE, TEST_SPRITER);

                expect(shape.meta).toBe('TEST_META');
            });

            it('should set exact meta if provided meta has relative name', () => {
                expect.hasAssertions();

                const TEST_SPRITER = {
                    config: {
                        shape: {
                            meta: { [path.basename(TEST_FILE.relative, '.svg')]: 'TEST_META' }, align: {},
                            id: {
                                generator() {
                                    return 'TEST_ID';
                                }
                            }
                        }
                    },
                    verbose: jest.fn()
                };
                const shape = new SVGShape(TEST_FILE, TEST_SPRITER);

                expect(shape.meta).toBe('TEST_META');
            });
        });

        describe('testing align', () => {
            it('should set empty array if align is not provided', () => {
                expect.hasAssertions();

                const TEST_SPRITER = {
                    config: {
                        shape: { meta: {}, align: {} },
                        id: {}
                    },
                    verbose: jest.fn()
                };
                const shape = new SVGShape(TEST_FILE, TEST_SPRITER);

                expect(shape.align).toStrictEqual([]);
            });

            it('should set empty array if align is has id', () => {
                expect.hasAssertions();

                const TEST_SPRITER = {
                    config: {
                        shape: { meta: {}, align: { '*': { TEST_1: 1 } } },
                        id: {}
                    },
                    verbose: jest.fn()
                };
                const shape = new SVGShape(TEST_FILE, TEST_SPRITER);

                expect(shape.align).toStrictEqual([['TEST_1', 1]]);
            });

            it('should set expected array if align has relative path', () => {
                expect.hasAssertions();

                const TEST_SPRITER = {
                    config: {
                        shape: {
                            meta: {},
                            align: { [path.basename(TEST_FILE.relative, '.svg')]: { TEST_3: 3 } }

                        }
                    },
                    verbose: jest.fn()
                };
                const shape = new SVGShape(TEST_FILE, TEST_SPRITER);

                expect(shape.align).toStrictEqual([['TEST_3', 3]]);
            });
        });
    });
});

