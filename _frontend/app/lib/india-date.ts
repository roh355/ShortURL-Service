export const INDIA_TIME_ZONE = "Asia/Kolkata";

const INDIA_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export function getIndiaDateKey(date: Date = new Date()): string {
	const parts = new Intl.DateTimeFormat("en-US", {
		timeZone: INDIA_TIME_ZONE,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).formatToParts(date);
	const part = (type: string) =>
		parts.find(item => item.type === type)?.value ?? "";

	return `${part("year")}-${part("month")}-${part("day")}`;
}

export function getIndiaDateRange(days: number, today: string): string[] {
	const todayAtUtcMidnight = Date.parse(`${today}T00:00:00.000Z`);
	return Array.from({ length: days }, (_, index) =>
		new Date(
			todayAtUtcMidnight - (days - index - 1) * DAY_MS
		).toISOString().slice(0, 10)
	);
}

export function millisecondsUntilNextIndiaDay(): number {
	const now = Date.now();
	const parts = new Intl.DateTimeFormat("en-US", {
		timeZone: INDIA_TIME_ZONE,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	}).formatToParts(new Date(now));
	const part = (type: string) =>
		Number(parts.find(item => item.type === type)?.value);
	const nextIndiaMidnight =
		Date.UTC(part("year"), part("month") - 1, part("day") + 1) -
		INDIA_OFFSET_MS;

	return Math.max(1000, nextIndiaMidnight - now + 1000);
}
