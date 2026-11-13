const INDIA_OFFSET_MS = (5 * 60 + 30) * 60 * 1000;
const INDIA_OFFSET_MINUTES = 330;
const DAY_MS = 24 * 60 * 60 * 1000;

export type IndiaDateWindow = {
	dates: string[];
	startUtc: Date;
	endUtc: Date;
};

/** Convert stored UTC timestamps into Indian calendar-date buckets in MySQL. */
export function indiaDateSql(column: "url.createTime" | "click.clickTime") {
	return `DATE_FORMAT(DATE_ADD(${column}, INTERVAL ${INDIA_OFFSET_MINUTES} MINUTE), '%Y-%m-%d')`;
}

export function getIndiaDateKey(date: Date): string {
	return new Date(date.getTime() + INDIA_OFFSET_MS)
		.toISOString()
		.slice(0, 10);
}

export function getRecentIndiaDateKeys(days: number): string[] {
	const today = getIndiaDateKey(new Date());
	const todayAtUtcMidnight = Date.parse(`${today}T00:00:00.000Z`);

	return Array.from({ length: days }, (_, offset) =>
		new Date(todayAtUtcMidnight - offset * DAY_MS).toISOString().slice(0, 10)
	);
}

/** UTC bounds for the requested inclusive range of Indian calendar dates. */
export function getIndiaDateWindow(days: number): IndiaDateWindow {
	const dates = getRecentIndiaDateKeys(days);
	const firstDate = dates[dates.length - 1];
	const today = dates[0];
	const startUtc = new Date(
		Date.parse(`${firstDate}T00:00:00.000Z`) - INDIA_OFFSET_MS
	);
	const endUtc = new Date(
		Date.parse(`${today}T00:00:00.000Z`) + DAY_MS - INDIA_OFFSET_MS
	);

	return { dates, startUtc, endUtc };
}
