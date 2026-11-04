import axios from "axios";

const api = axios.create({
	withCredentials: true,
	baseURL:
		process.env.NODE_ENV === "development"
			? "http://localhost:3000"
			: typeof window !== "undefined"
			? window.location.origin
			: "",
});
export default api;
