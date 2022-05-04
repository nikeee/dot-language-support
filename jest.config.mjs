/** @type {import("@jest/types").Config.ProjectConfig} */
const config = {
	preset: "ts-jest",
	testEnvironment: "node",
	transform: {
		"\\.[jt]sx?$": "ts-jest",
	},
	globals: {
		"ts-jest": {
			"useESM": true,
		},
	},
	moduleNameMapper: {
		"(.+)\\.js": "$1",
	},
	extensionsToTreatAsEsm: [".ts"],
};

export default config;
