import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import api from "../api/axios";

export interface User {
	id: number;
	name: string;
	email: string;
}

export interface LoginRequest {
	email: string;
	password: string;
}

export interface RegisterRequest {
	name: string;
	email: string;
	password: string;
}

export interface AuthResponse {
	success: boolean;
	user?: User;
	message?: string;
}

interface AuthContextType {
	user: User | null;
	isAuthenticated: boolean;
	loading: boolean;
	login: (data: LoginRequest) => Promise<AuthResponse>;
	register: (data: RegisterRequest) => Promise<AuthResponse>;
	logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
}

interface AuthProviderProps {
	children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(false);
	const [mounted, setMounted] = useState(false);

	const authenticate = async (
		endpoint: string,
		data: LoginRequest | RegisterRequest,
		fallbackMessage: string
	): Promise<AuthResponse> => {
		setLoading(true);
		try {
			const { data: result } = await api.post<AuthResponse>(endpoint, data);

			if (result.success && result.user) {
				setUser(result.user);
			}

			return result;
		} catch (error) {
			if (axios.isAxiosError<AuthResponse>(error) && error.response?.data) {
				return error.response.data;
			}
			console.error("Authentication request error:", error);
			return {
				success: false,
				message: fallbackMessage,
			};
		} finally {
			setLoading(false);
		}
	};

	const login = (data: LoginRequest) =>
		authenticate("/api/auth/login", data, "Login failed. Please try again.");

	const register = (data: RegisterRequest) =>
		authenticate(
			"/api/auth/register",
			data,
			"Registration failed. Please try again."
		);

	const logout = async (): Promise<void> => {
		try {
			await api.post("/api/auth/logout");
		} catch (error) {
			console.error("Logout request error:", error);
		} finally {
			setUser(null);
		}
	};

	// Restore the session only after the backend validates its HttpOnly cookie.
	useEffect(() => {
		let active = true;

		const restoreSession = async () => {
			// Remove the old, untrusted browser-stored session data.
			localStorage.removeItem("user");
			localStorage.removeItem("authToken");

			try {
				const { data: result } = await api.get<AuthResponse>("/api/auth/me");
				if (active && result.success && result.user) {
					setUser(result.user);
				}
			} catch {
				// Without a validated session, remain signed out.
			} finally {
				if (active) setMounted(true);
			}
		};

		void restoreSession();
		return () => {
			active = false;
		};
	}, []);

	const value: AuthContextType = {
		user,
		isAuthenticated: !!user,
		loading,
		login,
		register,
		logout,
	};

	// Don't render children until mounted to prevent hydration mismatches
	if (!mounted) {
		return null;
	}

	return (
		<AuthContext.Provider value={value}>{children}</AuthContext.Provider>
	);
}
