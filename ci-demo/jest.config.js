// Jest configuration for CI/CD demo
// --runInBand keeps tests sequential so the in-memory store is never shared
// jest-junit generates an XML report that GitHub Actions can display as a
// "Test Results" tab on every PR via dorny/test-reporter
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/e2e/**/*.test.js'],
  setupFiles: ['<rootDir>/tests/setup.js'],
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: './test-results',
        outputName: 'junit.xml',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
        ancestorSeparator: ' › ',
      },
    ],
  ],
  coverageDirectory: './coverage',
  collectCoverageFrom: ['src/**/*.js'],
};
