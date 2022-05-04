import type { ErrorCode } from "./types.js";

export const diagnosicSource = "DOT";
const errorCodeLength = 4;
const subErrorCodeLength = errorCodeLength - 1;

export function formatError(error: ErrorCode) {
	const subCode = (error.sub | 0)
		.toString()
		.padStart(subErrorCodeLength, "0");

	return diagnosicSource + error.source + subCode;
}
