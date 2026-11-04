import { NextFunction, Request, Response } from "express";
import { getUserIdFromAccessToken } from "../auth/jwt";

export interface AuthenticatedRequest extends Request {
	authUser?: { id: number };
}

function authenticate(
	req: Request,
	res: Response,
	next: NextFunction,
	optional: boolean
): void {
	const authorization = req.get("authorization");

	if (!authorization && optional) {
		next();
		return;
	}

	const match = authorization?.trim().match(/^Bearer\s+([^\s]+)$/i);
	if (!match) {
		res.status(401).json({
			success: false,
			message: "Authentication required",
		});
		return;
	}

	try {
		(req as AuthenticatedRequest).authUser = {
			id: getUserIdFromAccessToken(match[1]),
		};
		next();
	} catch {
		res.status(401).json({
			success: false,
			message: "Invalid or expired token",
		});
	}
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
