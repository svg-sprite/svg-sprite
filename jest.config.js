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

    verbose: true,
    maxWorkers: '50%'
};
