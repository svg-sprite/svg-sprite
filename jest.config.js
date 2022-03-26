'use strict';

const IGNORES = [
    '/node_modules/',
    'tmp'
];

module.exports = {
    clearMocks: true,
    resetMocks: true,
    coverageProvider: 'v8',
    coverageReporters: ['html', 'lcov', 'text'],
    collectCoverageFrom: [
        'bin/*.js',
        'lib/**/*.js'
    ],
    moduleFileExtensions: [
        'js',
        'json'
    ],
    modulePathIgnorePatterns: IGNORES,
    testMatch: [
        '<rootDir>/test/**/*.test.js'
    ],
    testPathIgnorePatterns: IGNORES,
    watchPathIgnorePatterns: IGNORES,
    setupFilesAfterEnv: ['<rootDir>/test/jest/setup.js'],
    globalSetup: '<rootDir>/test/jest/setup.global.js',
    testTimeout: 15_000
};
