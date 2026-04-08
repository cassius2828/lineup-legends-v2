/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  moduleNameMapper: {
    "^~/(.*)$": "<rootDir>/src/$1",
  },
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.jest.json",
      },
    ],
  },
  testMatch: ["**/__tests__/**/*.test.ts"],
  testPathIgnorePatterns: ["<rootDir>/e2e/"],
  collectCoverageFrom: [
    "src/lib/**/*.ts",
    "src/server/api/routers/lineup-utils.ts",
    "src/server/api/schemas/**/*.ts",
    "src/server/models/**/*.ts",
    "src/server/services/**/*.ts",
    "src/server/lib/**/*.ts",
    "!src/**/*.d.ts",
    "!src/**/index.ts",
  ],
  coverageDirectory: "coverage",
  verbose: true,
};
