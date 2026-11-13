import axios from "./axios";
import { getIndiaDateRange } from "~/lib/india-date";

export interface DailyStats {
	date: string;
	urls: number;
	clicks: number;
}

export const getStats = async (
	days: number,
	today: string
): Promise<DailyStats[]> => {
	const { data: urls } = await axios.get(`/stats/url/${days}`);
	const { data: clicks } = await axios.get(`/stats/click/${days}`);
	const urlCounts = new Map<string, number>(
		(urls as { date: string; count: string | number }[]).map(item => [
			item.date,
			Number(item.count),
		] as const)
	);
	const clickCounts = new Map<string, number>(
		(clicks as { date: string; count: string | number }[]).map(item => [
			item.date,
			Number(item.count),
		] as const)
	);

	return getIndiaDateRange(days, today).map(date => ({
		date,
		urls: urlCounts.get(date) ?? 0,
		clicks: clickCounts.get(date) ?? 0,
	}));
};

export const getTopURLs = async (days: number, count: number) => {
	const { data } = await axios.get(`/stats/top/${days}/${count}`);
	return data.map((item: any) => ({
		alias: item.alias,
		longURL: item.longURL,
		clicks: Number(item.clicks),
	}));
};
