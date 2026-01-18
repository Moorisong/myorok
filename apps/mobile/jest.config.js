module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__'],
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],
  moduleNameMapper: {
    '^@react-native-async-storage/async-storage$': '<rootDir>/__tests__/services/__mocks__/asyncStorage.ts',
    '^react-native-iap$': '<rootDir>/__tests__/services/__mocks__/reactNativeIap.ts',
    '^react-native$': '<rootDir>/__tests__/services/__mocks__/reactNative.ts',
    '^expo-sqlite$': '<rootDir>/__tests__/services/__mocks__/expoSqlite.ts',
    '^expo-notifications$': '<rootDir>/__tests__/services/__mocks__/expoNotifications.ts',
    '^expo-device$': '<rootDir>/__tests__/services/__mocks__/expoDevice.ts',
    '^expo-crypto$': '<rootDir>/__tests__/services/__mocks__/expoCrypto.ts',
    '^../constants/config$': '<rootDir>/__tests__/services/__mocks__/config.ts',
    '^../../constants/config$': '<rootDir>/__tests__/services/__mocks__/config.ts',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        module: 'commonjs',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        strict: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
        resolveJsonModule: true,
        declaration: true,
        declarationMap: true,
        noEmit: false,
        moduleResolution: 'node',
      }
    }]
  },
  resetMocks: true,
  testTimeout: 30000,
};
