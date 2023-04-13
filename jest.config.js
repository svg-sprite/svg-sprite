'use strict';

module.exports = {
    clearMocks: true,
    resetMocks: true,
    coverageProvider: 'v8',
    coverageReporters: ['html', 'lcov', 'text'],
    collectCoverageFrom: ['bin/*.js', 'lib/**/*.js', '!**/node_modules/**'],
    moduleFileExtensions: ['js', 'json'],
    testMatch: ['**/*.test.js'],
    testPathIgnorePatterns: ['/node_modules/'],
    setupFilesAfterEnv: ['<rootDir>/test/jest/setup.js'],
    globalSetup: '<rootDir>/test/jest/setup.global.js',
    testTimeout: 15_000
};
