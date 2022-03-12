'use strict';

module.exports = {
    clearMocks: true,
    resetMocks: true,
    coveragePathIgnorePatterns: [
        '/node_modules/'
    ],

    moduleFileExtensions: [
        'js',
        'json'
    ],

    testMatch: [
        '**/*.test.jest.js'
    ],

    testPathIgnorePatterns: [
        '/node_modules/'
    ],

    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    globalSetup: '<rootDir>/jest.setup.global.js',
    verbose: true,
    testTimeout: 10_000
};
