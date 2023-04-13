'use strict';

const path = require('node:path');
const SVGSpriterConfig = require('../../../lib/svg-sprite/config.js');
const { paths } = require('../../helpers/constants.js');

describe('testing initial attributes', () => {
  it('should set dest from config.dest', () => {
    expect.hasAssertions();

    const config = new SVGSpriterConfig({
      dest: paths.tmp
    });

    expect(config.dest).toBe(path.resolve(paths.tmp));
  });

  it('should set dest as current directory if not provided', () => {
    expect.hasAssertions();

    const config = new SVGSpriterConfig({});

    expect(config.dest).toBe(path.resolve('.'));
  });

  it('should set variables accordingly to config.variables', () => {
    expect.hasAssertions();

    const TEST_VARIABLES = { TEST_1: 1, TEST_2: 2 };
    const config = new SVGSpriterConfig({ variables: TEST_VARIABLES });

    expect(config.variables).toStrictEqual(TEST_VARIABLES);
    expect(config.variables).not.toBe(TEST_VARIABLES);
  });
});

describe('testing sort', () => {
  it('should set sort accordingly to config if function provided', () => {
    expect.hasAssertions();

    const TEST_FN = jest.fn();
    const config = new SVGSpriterConfig({ shape: { sort: TEST_FN } });

    expect(config.shape.sort).toBe(TEST_FN);
  });

  it('should set default sort if not provided', () => {
    expect.hasAssertions();

    const config = new SVGSpriterConfig({});
    const TEST_SHAPES = [{ id: 0 }, { id: 0 }, { id: 1 }, { id: 3 }, { id: 2 }];

    expect(TEST_SHAPES.sort(config.shape.sort)).toStrictEqual([{ id: 0 }, { id: 0 }, { id: 1 }, { id: 2 }, { id: 3 }]);
  });
});
