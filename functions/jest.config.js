/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: 'tsconfig.json' }]
  },
  roots: ['<rootDir>/test'],
  moduleNameMapper: {
    '^@wevote/shared$': '<rootDir>/../packages/shared/index.ts'
  },
  extensionsToTreatAsEsm: ['.ts'],
  setupFilesAfterEnv: ['<rootDir>/test/setup.js'],
  testTimeout: 30000
};
