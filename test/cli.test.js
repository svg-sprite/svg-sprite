'use strict';

const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { execFileSync } = require('node:child_process');

const BIN = path.resolve(__dirname, '..', 'bin', 'svg-sprite.js');

describe('CLI', () => {
  test('--help prints usage information', () => {
    const output = execFileSync('node', [BIN, '--help'], { encoding: 'utf8' });
    expect(output).toMatch(/svg-sprite/);
    expect(output).toMatch(/Usage:/);
    expect(output).toMatch(/--help/);
  });

  test('--version prints a semver version string', () => {
    const output = execFileSync('node', [BIN, '--version'], { encoding: 'utf8' }).trim();
    expect(output).toMatch(/^\d+\.\d+\.\d+/);
  });

  test('creates a CSS sprite in the destination directory', () => {
    const dest = fs.mkdtempSync(path.join(os.tmpdir(), 'svg-sprite-cli-'));
    const svg = path.resolve(__dirname, 'fixture', 'svg', 'single', 'weather-clear.svg');

    execFileSync('node', [BIN, '--css', '--dest', dest, svg], { encoding: 'utf8' });

    const spritePath = path.join(dest, 'css', 'svg');
    const files = fs.readdirSync(spritePath);
    const spriteFile = files.find(f => f.startsWith('sprite.css-') && f.endsWith('.svg'));
    expect(spriteFile).toBeDefined();

    const content = fs.readFileSync(path.join(spritePath, spriteFile), 'utf8');
    expect(content).toMatch(/<svg/);
    // Shape IDs are embedded in the sprite
    expect(content).toMatch(/weather-clear/);
  });

  test('creates multiple output files for a full CSS sprite with example', () => {
    const dest = fs.mkdtempSync(path.join(os.tmpdir(), 'svg-sprite-cli-'));
    const dir = path.resolve(__dirname, 'fixture', 'svg', 'single');
    const files = fs.readdirSync(dir).map(f => path.join(dir, f));

    execFileSync('node', [BIN, '--css', '--css-render-css', '--css-example', '--dest', dest, ...files], { encoding: 'utf8' });

    const cssFile = path.join(dest, 'css', 'sprite.css');
    const exampleFile = path.join(dest, 'css', 'sprite.css.html');
    expect(fs.existsSync(cssFile)).toBe(true);
    expect(fs.existsSync(exampleFile)).toBe(true);
  });

  test('exits with non-zero when no files are provided', () => {
    expect(() => {
      execFileSync('node', [BIN, '--css'], { encoding: 'utf8', stdio: 'pipe' });
    }).toThrow();
  });

  test('writes SVG output containing the original shape ID', () => {
    const dest = fs.mkdtempSync(path.join(os.tmpdir(), 'svg-sprite-cli-'));
    const svg = path.resolve(__dirname, 'fixture', 'svg', 'single', 'weather-clear.svg');

    execFileSync('node', [BIN, '--css', '--dest', dest, svg], { encoding: 'utf8' });

    const files = fs.readdirSync(path.join(dest, 'css', 'svg'));
    const spriteFile = files.find(f => f.startsWith('sprite.css-'));
    expect(spriteFile).toBeDefined();

    const content = fs.readFileSync(path.join(dest, 'css', 'svg', spriteFile), 'utf8');
    expect(content).toMatch(/weather-clear/);
  });
});
