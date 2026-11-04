import jwt = require("jsonwebtoken");

const TOKEN_LIFETIME = "1d";
const TOKEN_ISSUER = "short-url";

function getJwtSecret(): string {
	const secret = process.env.JWT_SECRET;

	if (!secret || Buffer.byteLength(secret) < 32) {
		throw new Error(
			"JWT_SECRET must be configured with a random value of at least 32 bytes."
		);
	}

	return secret;
}

export function createAccessToken(userId: number): string {
	return jwt.sign({}, getJwtSecret(), {
		algorithm: "HS256",
		expiresIn: TOKEN_LIFETIME,
		issuer: TOKEN_ISSUER,
		subject: String(userId),
	});
}

export function getUserIdFromAccessToken(token: string): number {
	const payload = jwt.verify(token, getJwtSecret(), {
		algorithms: ["HS256"],
		issuer: TOKEN_ISSUER,
	});

	if (typeof payload === "string" || !payload.sub) {
		throw new Error("Invalid access token");
	}

	const userId = Number(payload.sub);
	if (!Number.isSafeInteger(userId) || userId <= 0) {
		throw new Error("Invalid access token subject");
	}

	return userId;
}
