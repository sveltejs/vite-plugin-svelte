const isBuildTest = !!process.env.VITE_TEST_BUILD;
const isWin = process.platform === 'win32';
const isCI = !!process.env.CI;
module.exports = {
	preset: 'ts-jest',
	testMatch: process.env.VITE_TEST_BUILD
		? ['**/e2e-tests/**/*.spec.[jt]s?(x)']
		: ['**/*.spec.[jt]s?(x)'],
	testTimeout: isCI ? (isWin ? 45000 : 30000) : 10000,
	globalSetup: './scripts/jestGlobalSetup.js',
	globalTeardown: './scripts/jestGlobalTeardown.js',
	testEnvironment: './scripts/jestEnv.js',
	setupFilesAfterEnv: ['./scripts/jestPerTestSetup.ts'],
	watchPathIgnorePatterns: ['<rootDir>/temp'],
	modulePathIgnorePatterns: ['<rootDir>/temp'],
	moduleNameMapper: {
		testUtils: '<rootDir>/packages/e2e-tests/testUtils.ts'
	},
	globals: {
		'ts-jest': {
			tsconfig: './packages/e2e-tests/tsconfig.json'
		}
	},
	reporters: [
		'default',
		['jest-junit', { outputDirectory: `<rootDir>/temp/${isBuildTest ? 'build' : 'serve'}` }]
	]
};
