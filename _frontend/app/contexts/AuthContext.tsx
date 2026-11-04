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
	token?: string;
	user?: User;
	message?: string;
}

interface AuthContextType {
	user: User | null;
	isAuthenticated: boolean;
	loading: boolean;
	login: (data: LoginRequest) => Promise<AuthResponse>;
	register: (data: RegisterRequest) => Promise<AuthResponse>;
	logout: () => void;
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

			if (result.success && result.user && result.token) {
				setUser(result.user);
				localStorage.setItem("authToken", result.token);
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

	const logout = () => {
		setUser(null);
		localStorage.removeItem("authToken");
		localStorage.removeItem("user");
	};

	// Restore the session only after the backend validates the saved token.
	useEffect(() => {
		let active = true;

		const restoreSession = async () => {
			localStorage.removeItem("user");
			const token = localStorage.getItem("authToken");
			if (!token) {
				setMounted(true);
				return;
			}

			try {
				const { data: result } = await api.get<AuthResponse>("/api/auth/me");
				if (active && result.success && result.user) {
					setUser(result.user);
				} else if (active) {
					localStorage.removeItem("authToken");
				}
			} catch {
				if (active) localStorage.removeItem("authToken");
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
