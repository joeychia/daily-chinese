/** @type {import('jest').Config} */
export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^.+\\.svg$': 'jest-svg-transformer',
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^src/(.*)$': '<rootDir>/src/$1',
    '^config/(.*)$': '<rootDir>/src/config/$1',
    '^src/config/firebase$': '<rootDir>/src/config/__mocks__/firebase.ts',
    '\\.module\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^src/contexts/AuthContext$': '<rootDir>/src/contexts/__mocks__/AuthContext.tsx'
  },
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      useESM: true,
      isolatedModules: true
    }],
  },
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons'],
  },
  injectGlobals: true,
  moduleDirectories: ['node_modules', 'src'],
  transformIgnorePatterns: [
    'node_modules/(?!(firebase|@firebase)/)'
  ],
  modulePathIgnorePatterns: [
    '<rootDir>/dist/'
  ]
}; 