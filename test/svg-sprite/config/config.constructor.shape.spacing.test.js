'use strict';

const SVGSpriterConfig = require('../../../lib/svg-sprite/config.js');

describe('testing SVGSpriterConfig shape.spacing', () => {
  const DEFAULT_SPACING = {
    padding: {
      bottom: 0,
      left: 0,
      right: 0,
      top: 0
    }
  };

  it('should copy config.shape.spacing', () => {
    expect.hasAssertions();

    const TEST_SPACING = { TEST_1: 1, TEST_2: 2 };
    const config = new SVGSpriterConfig({ shape: { spacing: TEST_SPACING } });

    expect(config.shape.spacing).toBe(TEST_SPACING);
  });

  it('should set default object if passed falsy value', () => {
    expect.hasAssertions();

    const config = new SVGSpriterConfig({ shape: { spacing: false } });

    expect(config.shape.spacing).toStrictEqual(DEFAULT_SPACING);
  });

  it('should set default object if spacing is not provided', () => {
    expect.hasAssertions();

    const config = new SVGSpriterConfig({ shape: {} });

    expect(config.shape.spacing).toStrictEqual(DEFAULT_SPACING);
  });

  it('should set object accordingly to the provided spacing', () => {
    expect.hasAssertions();

    const config = new SVGSpriterConfig({ shape: { spacing: { padding: 1 } } });

    expect(config.shape.spacing).toStrictEqual({
      padding: {
        top: 1,
        left: 1,
        bottom: 1,
        right: 1
      }
    });
  });

  it('should set object with zeros if provided spacing is incorrect', () => {
    expect.hasAssertions();

    const config = new SVGSpriterConfig({
      shape: { spacing: { padding: '' } }
    });

    expect(config.shape.spacing).toStrictEqual(DEFAULT_SPACING);
  });

  it('should set object with zeros if provided spacing is filled with negative values', () => {
    expect.hasAssertions();

    const config = new SVGSpriterConfig({
      shape: { spacing: { padding: -10 } }
    });

    expect(config.shape.spacing).toStrictEqual(DEFAULT_SPACING);
  });

  it('should set parse the integer from provided spacing', () => {
    expect.hasAssertions();

    const config = new SVGSpriterConfig({
      shape: { spacing: { padding: '10' } }
    });

    expect(config.shape.spacing).toStrictEqual({
      padding: {
        top: 10,
        left: 10,
        bottom: 10,
        right: 10
      }
    });
  });

  describe('if provided spacing is array', () => {
    it('should set padding with same values if provided spacing has 1 element', () => {
      expect.hasAssertions();

      const config = new SVGSpriterConfig({
        shape: { spacing: { padding: [10] } }
      });

      expect(config.shape.spacing).toStrictEqual({
        padding: {
          top: 10,
          left: 10,
          bottom: 10,
          right: 10
        }
      });
    });

    it('should set padding with x | y values if provided spacing has 2 elements', () => {
      expect.hasAssertions();

      const config = new SVGSpriterConfig({
        shape: { spacing: { padding: [10, 5] } }
      });

      expect(config.shape.spacing).toStrictEqual({
        padding: {
          top: 10,
          left: 5,
          bottom: 10,
          right: 5
        }
      });
    });

    it('should set padding with mirrored x values if provided spacing has 3 element', () => {
      expect.hasAssertions();

      const config = new SVGSpriterConfig({
        shape: { spacing: { padding: [10, 5, 3] } }
      });

      expect(config.shape.spacing).toStrictEqual({
        padding: {
          top: 10,
          left: 5,
          bottom: 3,
          right: 5
        }
      });
    });

    it('should set padding with all the values if provided spacing has 4 and more elements', () => {
      expect.hasAssertions();

      const config = new SVGSpriterConfig({
        shape: { spacing: { padding: [10, 5, 3, 2] } }
      });

      expect(config.shape.spacing).toStrictEqual({
        padding: {
          top: 10,
          left: 2,
          bottom: 3,
          right: 5
        }
      });
    });

    it('should set padding with zeros if provided spacing has negative elements', () => {
      expect.hasAssertions();

      const config = new SVGSpriterConfig({
        shape: { spacing: { padding: [-10, -5, -3, -2] } }
      });

      expect(config.shape.spacing).toStrictEqual(DEFAULT_SPACING);
    });
  });
});
