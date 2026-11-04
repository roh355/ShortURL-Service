import { Router, Request, Response } from "express";
import { AuthResponse, AuthService } from "../services/AuthService";
import { clearAuthCookie, setAuthCookie } from "../auth/cookie";
import {
	authenticateToken,
	AuthenticatedRequest,
} from "../middleware/authenticateToken";
import { z } from "zod";

const router = Router();
const authService = new AuthService();

function startSession(res: Response, result: AuthResponse): AuthResponse {
	if (!result.success) return result;
	if (!result.user) throw new Error("Successful authentication has no user");

	setAuthCookie(res, result.user.id);
	return result;
}

router.get(
	"/me",
	authenticateToken,
	async (req: Request, res: Response): Promise<void> => {
		try {
			const userId = (req as AuthenticatedRequest).authUser?.id;
			if (!userId) {
				res.status(401).json({
					success: false,
					message: "Authentication required",
				});
				return;
			}

			const user = await authService.getUserById(userId);
			if (!user) {
				clearAuthCookie(res);
				res.status(401).json({
					success: false,
					message: "User no longer exists",
				});
				return;
			}

			res.json({ success: true, user });
		} catch (error) {
			console.error("Current user route error:", error);
			res.status(500).json({
				success: false,
				message: "Internal server error",
			});
		}
	}
);

router.post("/logout", (_req: Request, res: Response): void => {
	clearAuthCookie(res);
	res.json({ success: true });
});

const RegisterSchema = z.object({
	name: z
		.string()
		.min(1, "Name is required")
		.min(2, "Name must be at least 2 characters long")
		.max(50, "Name must be less than 50 characters"),
	email: z
		.string()
		.min(1, "Email is required")
		.email("Please enter a valid email address"),
	password: z
		.string()
		.min(1, "Password is required")
		.min(6, "Password must be at least 6 characters long")
		.max(100, "Password must be less than 100 characters"),
});

const LoginSchema = z.object({
	email: z.email(),
	password: z
		.string()
		.min(1, "Password is required")
		.min(6, "Password must be at least 6 characters long"),
});

router.post("/register", async (req: Request, res: Response): Promise<void> => {
	try {
		const validationResult = RegisterSchema.safeParse(req.body);

		if (!validationResult.success) {
			const errorMessages = validationResult.error.issues
				.map(issue => issue.message)
				.join(", ");

			res.status(400).json({
				success: false,
				message: errorMessages,
			});
			return;
		}

		const { name, email, password } = validationResult.data;
		const result = await authService.register({ name, email, password });

		if (!result.success) {
			res.status(400).json(result);
			return;
		}

		res.status(201).json(startSession(res, result));
	} catch (error) {
		console.error("Register route error:", error);
		res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
});

router.post("/login", async (req: Request, res: Response): Promise<void> => {
	try {
		const validationResult = LoginSchema.safeParse(req.body);

		if (!validationResult.success) {
			const errorMessages = validationResult.error.issues
				.map(issue => issue.message)
				.join(", ");

			res.status(400).json({
				success: false,
				message: errorMessages,
			});
			return;
		}

		const { email, password } = validationResult.data;
		const result = await authService.login({ email, password });

		if (!result.success) {
			res.status(401).json(result);
			return;
		}

		res.json(startSession(res, result));
	} catch (error) {
		console.error("Login route error:", error);
		res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
});

export default router;
