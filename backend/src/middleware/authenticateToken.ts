import { NextFunction, Request, Response } from "express";
import { getUserIdFromAccessToken } from "../auth/jwt";
import { AUTH_COOKIE_NAME, clearAuthCookie } from "../auth/cookie";

export interface AuthenticatedRequest extends Request {
	authUser?: { id: number };
}

function authenticate(
	req: Request,
	res: Response,
	next: NextFunction,
	optional: boolean
): void {
	const sessionToken = readSessionCookie(req);

	if (!sessionToken && optional) {
		next();
		return;
	}

	if (!sessionToken) {
		res.status(401).json({
			success: false,
			message: "Authentication required",
		});
		return;
	}

	try {
		(req as AuthenticatedRequest).authUser = {
			id: getUserIdFromAccessToken(sessionToken),
		};
		next();
	} catch {
		clearAuthCookie(res);
		res.status(401).json({
			success: false,
			message: "Invalid or expired token",
		});
	}
}

function readSessionCookie(req: Request): string | undefined {
	const cookiePrefix = `${AUTH_COOKIE_NAME}=`;
	const cookie = req.headers.cookie
		?.split(";")
		.map(part => part.trim())
		.find(part => part.startsWith(cookiePrefix));

	return cookie?.slice(cookiePrefix.length);
}

export function authenticateToken(
	req: Request,
	res: Response,
	next: NextFunction
): void {
	authenticate(req, res, next, false);
}

export function optionalAuthenticateToken(
	req: Request,
	res: Response,
	next: NextFunction
): void {
	authenticate(req, res, next, true);
}
