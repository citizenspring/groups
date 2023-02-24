import type {Config} from 'jest';

export default async (): Promise<Config> => {
  return {
  preset: 'ts-jest',
  setupFiles: ['<rootDir>/.env.test.local.js'],
  setupFilesAfterEnv: [`<rootDir>/jest.setup.tsx`],
  testEnvironment: 'node',
  testPathIgnorePatterns: [`.env.*`, `node_modules`, `\\.cache`, `<rootDir>.*/public`],
  transform: {
    '^.+\\.(ts|tsx)?$': 'ts-jest',
    '^.+\\.(js|jsx)$': 'babel-jest'
  },
    verbose: true,
  };
};

