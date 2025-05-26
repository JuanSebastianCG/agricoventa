module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    roots: ["<rootDir>/src"],
    testMatch: ["**/__tests__/**/*.ts", "**/?(*.)+(spec|test).ts"],
    transform: {
      "^.+\\.ts$": "ts-jest",
    },
    moduleNameMapper: {
      "^@/(.*)$": "<rootDir>/src/$1",
    },
    clearMocks: true,
    collectCoverage: true,
    coverageDirectory: "coverage",
    coveragePathIgnorePatterns: ["/node_modules/", "/dist/"],
    coverageReporters: ["text", "lcov"],
    testTimeout: 10000,
}
  