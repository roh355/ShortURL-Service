import api from "./axios";
import { getIndiaDateRange } from "~/lib/india-date";

export interface MyLink {
	alias: string;
	longURL: string;
	createTime: string;
	clicks: number;
}

export interface DailyClicks {
	date: string;
	count: number;
}

export const getMyLinks = async (): Promise<MyLink[]> => {
	const { data } = await api.get<MyLink[]>("/api/my-links");
	return data;
};

export const getMyLinkClicks = async (
	days: number,
	today: string
): Promise<DailyClicks[]> => {
	const { data } = await api.get<DailyClicks[]>(
		`/api/my-links/stats/${days}`
	);
	const clickCounts = new Map(
		data.map(item => [item.date, Number(item.count)] as const)
	);
	return getIndiaDateRange(days, today).map(date => ({
		date,
		count: clickCounts.get(date) ?? 0,
	}));
};

export const deleteMyLink = async (alias: string): Promise<void> => {
	await api.delete(`/api/my-links/${encodeURIComponent(alias)}`);
};
