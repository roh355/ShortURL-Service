import { Response } from "express";
import { createAccessToken } from "./jwt";

export const AUTH_COOKIE_NAME = "short_url_session";

const COOKIE_MAX_AGE = 24 * 60 * 60 * 1000;

function cookieOptions() {
	return {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax" as const,
		path: "/",
		maxAge: COOKIE_MAX_AGE,
	};
}

export function setAuthCookie(res: Response, userId: number): void {
	res.cookie(AUTH_COOKIE_NAME, createAccessToken(userId), cookieOptions());
}

export function clearAuthCookie(res: Response): void {
	res.clearCookie(AUTH_COOKIE_NAME, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		path: "/",
	});
}
