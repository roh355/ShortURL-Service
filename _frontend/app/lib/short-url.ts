export function getShortURL(alias: string): string {
	const baseURL = import.meta.env.DEV
		? "http://localhost:3000"
		: window.location.origin;
	return `${baseURL}/${alias}`;
}
