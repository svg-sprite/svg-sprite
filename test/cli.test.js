'use strict';

const { execSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const CLI_PATH = path.resolve(__dirname, '../bin/svg-sprite.js');

describe('svg-sprite CLI', () => {
  const tmpPath = path.join(__dirname, '..', 'tmp', 'cli');

  const createTempDirs = testId => {
    const subTempPath = path.join(tmpPath, testId);
    const inputDir = path.join(subTempPath, 'input');
    const outputDir = path.join(subTempPath, 'output');
    fs.mkdirSync(subTempPath, { recursive: true });
    fs.mkdirSync(inputDir, { recursive: true });
    fs.mkdirSync(outputDir, { recursive: true });
    return { inputDir, outputDir };
  };

  const createSampleSVGs = inputDir => {
    const circleSVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40"/></svg>';
    const squareSVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="10" y="10" width="80" height="80"/></svg>';
    const triangleSVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="50,10 90,90 10,90"/></svg>';

    fs.mkdirSync(path.join(inputDir, 'shapes'), { recursive: true });
    fs.mkdirSync(path.join(inputDir, 'icons'), { recursive: true });

    fs.writeFileSync(path.join(inputDir, 'shapes', 'circle.svg'), circleSVG);
    fs.writeFileSync(path.join(inputDir, 'shapes', 'square.svg'), squareSVG);
    fs.writeFileSync(path.join(inputDir, 'icons', 'triangle.svg'), triangleSVG);
  };

  const runCLI = args => {
    return execSync(`node ${CLI_PATH} ${args}`, { encoding: 'utf8', stdio: 'pipe' });
  };

  const findSpriteFile = directory => {
    const files = fs.readdirSync(directory);
    const spriteFile = files.find(file => /^sprite\.css-[a-f\d]+\.svg$/.test(file));
    return spriteFile ? path.join(directory, spriteFile) : null;
  };

  afterAll(() => {
    fs.rmSync(tmpPath, { recursive: true, force: true });
  });

  test('should display help information', () => {
    const output = runCLI('--help');

    expect(output).toContain('Usage: svg-sprite.js [options] files');
    expect(output).toContain('Options:');
  });

  test('should create a CSS sprite', () => {
    const { inputDir, outputDir } = createTempDirs('css');
    createSampleSVGs(inputDir);

    const args = `-cD ${outputDir} --ccss ${inputDir}/**/*.svg`;
    runCLI(args);

    const cssFile = path.join(outputDir, 'css', 'sprite.css');

    expect(fs.existsSync(cssFile)).toBeTruthy();

    const hashedSpriteFile = findSpriteFile(path.join(outputDir, 'css', 'svg'));

    expect(hashedSpriteFile).not.toBeNull();

    const cssContent = fs.readFileSync(cssFile, 'utf8');

    expect(cssContent).toContain('.svg-circle');
    expect(cssContent).toContain('.svg-square');

    const svgContent = fs.readFileSync(hashedSpriteFile, 'utf8');

    expect(svgContent).toContain('id="circle"');
    expect(svgContent).toContain('id="square"');
  });

  test('should create a view sprite', () => {
    const { inputDir, outputDir } = createTempDirs('view');
    createSampleSVGs(inputDir);

    const args = `-vD ${outputDir} --vcss ${inputDir}/**/*.svg`;
    runCLI(args);

    expect(fs.existsSync(path.join(outputDir, 'view', 'sprite.css'))).toBeTruthy();

    const hashedSpriteFile = findSpriteFile(path.join(outputDir, 'view', 'svg'));

    expect(hashedSpriteFile).not.toBeNull();
  });

  test('should create a defs sprite', () => {
    const { inputDir, outputDir } = createTempDirs('defs');
    createSampleSVGs(inputDir);

    const args = `-dD ${outputDir} --dcss ${inputDir}/**/*.svg`;
    runCLI(args);

    expect(fs.existsSync(path.join(outputDir, 'defs', 'sprite.css'))).toBeTruthy();
    expect(fs.existsSync(path.join(outputDir, 'defs', 'svg', 'sprite.css.svg'))).toBeTruthy();
  });

  test('should create a symbol sprite', () => {
    const { inputDir, outputDir } = createTempDirs('symbol');
    createSampleSVGs(inputDir);

    const args = `-sD ${outputDir} --scss ${inputDir}/**/*.svg`;
    runCLI(args);

    expect(fs.existsSync(path.join(outputDir, 'symbol', 'sprite.css'))).toBeTruthy();
    expect(fs.existsSync(path.join(outputDir, 'symbol', 'svg', 'sprite.css.svg'))).toBeTruthy();
  });

  test('should create a stack sprite', () => {
    const { inputDir, outputDir } = createTempDirs('stack');
    createSampleSVGs(inputDir);

    const args = `-SD ${outputDir} --Scss ${inputDir}/**/*.svg`;
    runCLI(args);

    expect(fs.existsSync(path.join(outputDir, 'stack', 'sprite.css'))).toBeTruthy();
    expect(fs.existsSync(path.join(outputDir, 'stack', 'svg', 'sprite.css.svg'))).toBeTruthy();
  });

  test('should add padding to shapes', () => {
    const { inputDir, outputDir } = createTempDirs('padding');
    createSampleSVGs(inputDir);

    const args = `-cD ${outputDir} --ccss -p 10 ${inputDir}/**/*.svg`;
    runCLI(args);

    const svgContent = fs.readFileSync(findSpriteFile(path.join(outputDir, 'css', 'svg')), 'utf8');

    expect(svgContent).toMatch(/viewBox="-10 -10 120 120"/);
  });

  test('should use custom ID generator', () => {
    const { inputDir, outputDir } = createTempDirs('id-generator');
    createSampleSVGs(inputDir);

    const args = `-cD ${outputDir} --ccss --shape-id-generator="icon-%s" ${inputDir}/**/*.svg`;
    runCLI(args);

    const cssContent = fs.readFileSync(path.join(outputDir, 'css', 'sprite.css'), 'utf8');

    expect(cssContent).toMatch(/\.svg-icon-circle/);
    expect(cssContent).toMatch(/\.svg-icon-square/);
  });

  test('should create example HTML', () => {
    const { inputDir, outputDir } = createTempDirs('example');
    createSampleSVGs(inputDir);

    const args = `-cD ${outputDir} --ccss --cx ${inputDir}/**/*.svg`;
    runCLI(args);

    expect(fs.existsSync(path.join(outputDir, 'css', 'sprite.css.html'))).toBeTruthy();
  });

  test('should use external config file', () => {
    const { inputDir, outputDir } = createTempDirs('config');
    createSampleSVGs(inputDir);

    const configPath = path.join(outputDir, 'config.json');
    const config = {
      mode: {
        css: {
          render: {
            css: true
          }
        }
      },
      shape: {
        spacing: {
          padding: 20
        }
      }
    };
    fs.writeFileSync(configPath, JSON.stringify(config));

    const args = `--config ${configPath} -D ${outputDir} ${inputDir}/**/*.svg`;
    runCLI(args);

    const svgContent = fs.readFileSync(findSpriteFile(path.join(outputDir, 'css', 'svg')), 'utf8');

    expect(svgContent).toMatch(/viewBox="-20 -20 140 140"/);
  });

  test('should create multiple sprite types simultaneously', () => {
    const { inputDir, outputDir } = createTempDirs('multi-mode');
    createSampleSVGs(inputDir);

    const args = `-csdD ${outputDir} --ccss --scss --dcss ${inputDir}/**/*.svg`;
    runCLI(args);

    expect(fs.existsSync(path.join(outputDir, 'css', 'sprite.css'))).toBeTruthy();
    expect(fs.existsSync(path.join(outputDir, 'symbol', 'sprite.css'))).toBeTruthy();
    expect(fs.existsSync(path.join(outputDir, 'defs', 'sprite.css'))).toBeTruthy();
  });
});
