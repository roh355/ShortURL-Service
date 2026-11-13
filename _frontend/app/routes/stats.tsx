import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { getStats } from "~/api/stats";
import { getIndiaDateRange } from "~/lib/india-date";
import { useIndiaToday } from "~/hooks/use-india-today";
import { TopURLsTable } from "~/components/top-urls-table";
import { Card } from "~/components/ui/card";
import {
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
	ChartTooltip,
	ChartTooltipContent,
	type ChartConfig,
} from "~/components/ui/chart";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";

const chartConfig = {
	visitors: {
		label: "Visitors",
	},
	urls: {
		label: "URLs",
		color: "var(--chart-1)",
	},
	clicks: {
		label: "Clicks",
		color: "var(--chart-2)",
	},
} satisfies ChartConfig;

const stats = () => {
	const [timeRange, setTimeRange] = useState("30");
	const today = useIndiaToday();

	const {
		data: chartData = [],
		isLoading: isChartLoading,
		isError: isChartError,
	} = useQuery({
		queryKey: ["stats", timeRange, today],
		queryFn: () => getStats(Number(timeRange), today),
		placeholderData: keepPreviousData,
	});
	const chartDataByDate = new Map(chartData.map(item => [item.date, item]));
	const visibleChartData = getIndiaDateRange(
		Number(timeRange),
		today
	).map(
		date =>
			chartDataByDate.get(date) ?? {
				date,
				urls: 0,
				clicks: 0,
			}
	);
	const hasActivity = visibleChartData.some(
		item => item.urls > 0 || item.clicks > 0
	);

	return (
		<div className="flex flex-col lg:flex-row h-full gap-6 p-6">
			<Card className="min-w-0 lg:flex-1">
				<div className="min-w-0 p-6">
					<div className="mb-4 flex items-center justify-between">
						<div>
							<h3 className="text-lg font-semibold mb-2">
								Activity Overview
							</h3>
							<p className="text-sm text-muted-foreground">
								Daily trends for URLs created and clicks
								received
							</p>
						</div>
						<Select value={timeRange} onValueChange={setTimeRange}>
							<SelectTrigger className="w-[120px] h-8 text-xs">
								<SelectValue />
							</SelectTrigger>
							<SelectContent className="rounded-lg">
								<SelectItem value="7" className="text-xs">
									7 days
								</SelectItem>
								<SelectItem value="30" className="text-xs">
									30 days
								</SelectItem>
								<SelectItem value="90" className="text-xs">
									90 days
								</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div className="w-full">
						{isChartLoading ? (
							<div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
								Loading activity…
							</div>
						) : isChartError ? (
							<div className="flex h-[260px] items-center justify-center text-sm text-destructive">
								Could not load activity data.
							</div>
						) : !hasActivity ? (
							<div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
								No activity in this period.
							</div>
						) : (
							<ChartContainer
								config={chartConfig}
								className="h-[260px] w-full"
							>
								<AreaChart data={visibleChartData}>
								<defs>
									<linearGradient
										id="fillURLs"
										x1="0"
										y1="0"
										x2="0"
										y2="1"
									>
										<stop
											offset="5%"
											stopColor="var(--color-urls)"
											stopOpacity={0.8}
										/>
										<stop
											offset="95%"
											stopColor="var(--color-urls)"
											stopOpacity={0.1}
										/>
									</linearGradient>
									<linearGradient
										id="fillClicks"
										x1="0"
										y1="0"
										x2="0"
										y2="1"
									>
										<stop
											offset="5%"
											stopColor="var(--color-clicks)"
											stopOpacity={0.8}
										/>
										<stop
											offset="95%"
											stopColor="var(--color-clicks)"
											stopOpacity={0.1}
										/>
									</linearGradient>
								</defs>
								<CartesianGrid vertical={false} />
								<YAxis
									allowDecimals={false}
									tickLine={false}
									axisLine={false}
									tickMargin={8}
								/>
								<XAxis
									dataKey="date"
									interval="preserveEnd"
									padding={{ left: 12, right: 16 }}
									tickLine={false}
									axisLine={false}
									tickMargin={8}
									minTickGap={32}
									tickFormatter={value => {
										const date = new Date(value);
										const dateLabel = date.toLocaleDateString(
											"en-US",
											{
												month: "short",
												day: "numeric",
												timeZone: "Asia/Kolkata",
											}
										);
										return value === today
											? `${dateLabel} · Today`
											: dateLabel;
									}}
								/>
								<ChartTooltip
									cursor={false}
									content={
										<ChartTooltipContent
											labelFormatter={value => {
												return new Date(
													value
												).toLocaleDateString("en-US", {
													month: "short",
													day: "numeric",
													timeZone: "Asia/Kolkata",
												});
											}}
											indicator="dot"
										/>
									}
								/>
								<Area
									dataKey="urls"
									type="natural"
									fill="url(#fillURLs)"
									stroke="var(--color-urls)"
									strokeWidth={2}
									stackId="a"
								/>
								<Area
									dataKey="clicks"
									type="natural"
									fill="url(#fillClicks)"
									stroke="var(--color-clicks)"
									strokeWidth={2}
									stackId="a"
								/>
								<ChartLegend content={<ChartLegendContent />} />
								</AreaChart>
							</ChartContainer>
						)}
					</div>
				</div>
			</Card>
			<Card className="min-w-0 lg:flex-1">
				<div className="min-w-0 p-6">
					<div className="mb-4">
						<h3 className="text-lg font-semibold mb-2">
							Top Performing URLs
						</h3>
						<p className="text-sm text-muted-foreground">
							Most clicked short URLs in the selected time period
						</p>
					</div>
					<TopURLsTable timeRange={timeRange} />
				</div>
			</Card>
		</div>
	);
};

export default stats;
