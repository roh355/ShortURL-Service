import {
	keepPreviousData,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Copy, ExternalLink, Link2, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { deleteMyLink, getMyLinkClicks, getMyLinks } from "~/api/my-links";
import { getShortURL } from "~/lib/short-url";
import { getIndiaDateRange } from "~/lib/india-date";
import { useIndiaToday } from "~/hooks/use-india-today";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import {
	ChartContainer,
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
import { useAuth } from "~/contexts/AuthContext";

const chartConfig = {
	count: {
		label: "Clicks",
		color: "var(--chart-2)",
	},
} satisfies ChartConfig;

export default function MyLinks() {
	const { user, isAuthenticated } = useAuth();
	const queryClient = useQueryClient();
	const [timeRange, setTimeRange] = useState("30");
	const today = useIndiaToday();
	const {
		data: links = [],
		isLoading,
		isError,
	} = useQuery({
		queryKey: ["my-links", user?.id],
		queryFn: getMyLinks,
		enabled: isAuthenticated && !!user,
	});
	const {
		data: clickData = [],
		isLoading: isClicksLoading,
		isError: isClicksError,
	} = useQuery({
		queryKey: ["my-link-stats", user?.id, timeRange, today],
		queryFn: () => getMyLinkClicks(Number(timeRange), today),
		enabled: isAuthenticated && !!user,
		placeholderData: keepPreviousData,
	});
	const clickDataByDate = new Map(clickData.map((item) => [item.date, item]));
	const visibleClickData = getIndiaDateRange(Number(timeRange), today).map(
		(date) =>
			clickDataByDate.get(date) ?? {
				date,
				count: 0,
			}
	);
	const deleteMutation = useMutation({
		mutationFn: deleteMyLink,
		onSuccess: async () => {
			await Promise.all([
				queryClient.invalidateQueries({
					queryKey: ["my-links", user?.id],
				}),
				queryClient.invalidateQueries({
					queryKey: ["my-link-stats", user?.id],
				}),
			]);
			toast.success("Link deleted");
		},
		onError: () => toast.error("Could not delete this link"),
	});

	if (!isAuthenticated || !user) {
		return (
			<div className="flex h-full items-center justify-center p-6">
				<Card className="w-full max-w-lg">
					<CardContent className="space-y-2 pt-6 text-center">
						<Link2 className="mx-auto h-8 w-8 text-muted-foreground" />
						<h1 className="text-xl font-semibold">My Links</h1>
						<p className="text-sm text-muted-foreground">
							Sign in to view and manage the links you have
							created.
						</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	const copyLink = async (alias: string) => {
		try {
			await navigator.clipboard.writeText(getShortURL(alias));
			toast.success("Short URL copied to clipboard");
		} catch {
			toast.error("Could not copy the short URL");
		}
	};

	const removeLink = (alias: string) => {
		if (
			window.confirm(
				`Delete /${alias} and its click history? This cannot be undone.`
			)
		) {
			deleteMutation.mutate(alias);
		}
	};

	return (
		<div className="h-full overflow-y-auto p-6 md:p-8">
			<div className="mx-auto flex max-w-6xl flex-col gap-6">
				<div>
					<h1 className="text-2xl font-semibold">My Links</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						View and manage the short links you have created.
					</p>
				</div>

				<Card>
					<div className="p-6">
						<div className="mb-4 flex items-center justify-between gap-4">
							<div>
								<h2 className="text-lg font-semibold">
									Clicks over time
								</h2>
								<p className="text-sm text-muted-foreground">
									Daily clicks across your links
								</p>
							</div>
							<Select
								value={timeRange}
								onValueChange={setTimeRange}
							>
								<SelectTrigger className="h-8 w-[120px] text-xs">
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
						{isClicksLoading ? (
							<div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
								Loading click activity…
							</div>
						) : isClicksError ? (
							<div className="flex h-[260px] items-center justify-center text-sm text-destructive">
								Could not load click activity.
							</div>
						) : !visibleClickData.some((item) => item.count > 0) ? (
							<div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
								No clicks in this period.
							</div>
						) : (
							<ChartContainer
								config={chartConfig}
								className="h-[260px] w-full"
							>
								<AreaChart data={visibleClickData}>
									<defs>
										<linearGradient
											id="fillMyClicks"
											x1="0"
											y1="0"
											x2="0"
											y2="1"
										>
											<stop
												offset="5%"
												stopColor="var(--color-count)"
												stopOpacity={0.8}
											/>
											<stop
												offset="95%"
												stopColor="var(--color-count)"
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
										tickFormatter={(value) => {
											const dateLabel = new Date(
												value
											).toLocaleDateString("en-US", {
												month: "short",
												day: "numeric",
												timeZone: "Asia/Kolkata",
											});
											return value === today
												? `${dateLabel} · Today`
												: dateLabel;
										}}
									/>
									<ChartTooltip
										cursor={false}
										content={
											<ChartTooltipContent
												labelFormatter={(value) =>
													new Date(
														value
													).toLocaleDateString(
														"en-US",
														{
															month: "short",
															day: "numeric",
															timeZone:
																"Asia/Kolkata",
														}
													)
												}
												indicator="dot"
											/>
										}
									/>
									<Area
										dataKey="count"
										name="clicks"
										type="natural"
										fill="url(#fillMyClicks)"
										stroke="var(--color-count)"
										strokeWidth={2}
									/>
								</AreaChart>
							</ChartContainer>
						)}
					</div>
				</Card>

				<section className="space-y-4">
					<div className="flex items-center justify-between">
						<h2 className="text-lg font-semibold">Your links</h2>
						<span className="text-sm text-muted-foreground">
							{links.length}{" "}
							{links.length === 1 ? "link" : "links"}
						</span>
					</div>

					{isLoading ? (
						<Card className="p-6 text-sm text-muted-foreground">
							Loading your links…
						</Card>
					) : isError ? (
						<Card className="p-6 text-sm text-destructive">
							Could not load your links. Please try again.
						</Card>
					) : links.length === 0 ? (
						<Card className="p-6 text-sm text-muted-foreground">
							You have not created any links yet. Create one from
							the home page and it will show up here.
						</Card>
					) : (
						<div className="flex flex-col gap-3">
							{links.map((link) => (
								<Card key={link.alias} className="p-4">
									<div className="flex flex-col gap-4 sm:flex-row sm:items-center">
										<div className="min-w-0 flex-1 space-y-1">
											<div className="flex flex-wrap items-center gap-x-3 gap-y-1">
												<span
													className="truncate font-mono text-sm font-medium"
													title={getShortURL(
														link.alias
													)}
												>
													{getShortURL(link.alias)}
												</span>
												<span className="text-xs text-muted-foreground">
													{link.clicks.toLocaleString()}{" "}
													{link.clicks === 1
														? "click"
														: "clicks"}
												</span>
											</div>
											<a
												href={link.longURL}
												target="_blank"
												rel="noopener noreferrer"
												className="block truncate text-sm text-muted-foreground hover:underline"
												title={link.longURL}
											>
												{link.longURL}
											</a>
											<p className="text-xs text-muted-foreground">
												Created{" "}
												{new Date(
													link.createTime
												).toLocaleString("en-IN", {
													timeZone: "Asia/Kolkata",
												})}
											</p>
										</div>
										<div className="flex shrink-0 items-center gap-1">
											<Button
												variant="ghost"
												size="icon"
												title="Copy short link"
												aria-label={`Copy short link for ${link.alias}`}
												onClick={() =>
													void copyLink(link.alias)
												}
											>
												<Copy />
											</Button>
											<Button
												variant="ghost"
												size="icon"
												title="Open short link"
												aria-label={`Open short link for ${link.alias}`}
												onClick={() =>
													window.open(
														getShortURL(link.alias),
														"_blank",
														"noopener,noreferrer"
													)
												}
											>
												<ExternalLink />
											</Button>
											<Button
												variant="ghost"
												size="icon"
												title="Delete link"
												aria-label={`Delete link ${link.alias}`}
												disabled={
													deleteMutation.isPending
												}
												onClick={() =>
													removeLink(link.alias)
												}
												className="text-muted-foreground hover:text-destructive"
											>
												<Trash2 />
											</Button>
										</div>
									</div>
								</Card>
							))}
						</div>
					)}
				</section>
			</div>
		</div>
	);
}
