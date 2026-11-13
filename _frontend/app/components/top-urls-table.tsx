import { useQuery } from "@tanstack/react-query";
import { ExternalLink, Copy, TrendingUp } from "lucide-react";
import { getTopURLs } from "~/api/stats";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "~/components/ui/table";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { toast } from "sonner";
import { getShortURL } from "~/lib/short-url";
import { useIndiaToday } from "~/hooks/use-india-today";

interface TopURL {
	alias: string;
	longURL: string;
	clicks: number;
	creatorName?: string;
	creatorEmail?: string;
}

interface TopURLsTableProps {
	timeRange: string;
}

export function TopURLsTable({ timeRange }: TopURLsTableProps) {
	const today = useIndiaToday();
	const {
		data: topURLs = [],
		isLoading,
		error,
	} = useQuery({
		queryKey: ["topURLs", timeRange, today],
		queryFn: () => getTopURLs(Number(timeRange), 10), // Fixed count to 10
		enabled: true,
		retry: 3,
	});

	const copyToClipboard = (alias: string) => {
		const shortUrl = getShortURL(alias);
		navigator.clipboard.writeText(shortUrl);
		toast.success("Short URL copied to clipboard!");
	};

	const openURL = (alias: string) => {
		const shortUrl = getShortURL(alias);
		window.open(shortUrl, "_blank");
	};

	return (
		<div className="w-full min-w-0">
			{isLoading ? (
				<div className="flex items-center justify-center h-32">
					<div className="text-muted-foreground">Loading...</div>
				</div>
			) : error ? (
				<div className="flex items-center justify-center h-32">
					<div className="text-destructive">Failed to load data</div>
				</div>
			) : topURLs.length === 0 ? (
				<div className="flex items-center justify-center h-32">
					<div className="text-muted-foreground">
						No data available
					</div>
				</div>
			) : (
				<div className="w-full max-w-full overflow-x-auto border rounded-md">
					<Table className="min-w-[560px] table-fixed">
						<TableHeader className="sticky top-0 bg-background/95 backdrop-blur z-10 border-b">
							<TableRow>
								<TableHead className="w-10 px-2 text-center">
									#
								</TableHead>
								<TableHead className="w-28 px-2">
									Short URL
								</TableHead>
								<TableHead className="hidden px-2 xl:table-cell">
									Long URL
								</TableHead>
								<TableHead className="w-24 px-2">Creator</TableHead>
								<TableHead className="w-20 px-2 text-right">
									Clicks
								</TableHead>
								<TableHead className="w-16 px-2 text-center">
									Actions
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{topURLs.map((url: TopURL, index: number) => (
								<TableRow
									key={url.alias}
									className="hover:bg-muted/50"
								>
									<TableCell className="px-2 text-center">
										<Badge
											variant={
												index < 3
													? "default"
													: "secondary"
											}
											className="w-6 h-6 rounded-full flex items-center justify-center text-xs"
										>
											{index + 1}
										</Badge>
									</TableCell>
									<TableCell className="px-2">
										<div className="font-mono text-sm bg-muted px-2 py-1 rounded truncate">
											/{url.alias}
										</div>
									</TableCell>
									<TableCell className="hidden px-2 xl:table-cell">
										<div className="truncate text-muted-foreground text-sm">
											{url.longURL}
										</div>
									</TableCell>
									<TableCell className="px-2">
										{url.creatorName ? (
											<div className="min-w-0 text-sm">
												<div className="truncate font-medium">
													{url.creatorName}
												</div>
												<div className="text-xs text-muted-foreground truncate">
													{url.creatorEmail}
												</div>
											</div>
										) : (
											<span className="text-xs text-muted-foreground">
												Anonymous
											</span>
										)}
									</TableCell>
									<TableCell className="px-2 text-right">
										<Badge
											variant="outline"
											className="font-mono text-xs"
										>
											{url.clicks.toLocaleString()}
										</Badge>
									</TableCell>
									<TableCell className="px-2 text-center">
										<div className="flex gap-1 justify-center">
											<Button
												variant="ghost"
												size="sm"
												onClick={() =>
													copyToClipboard(url.alias)
												}
												className="h-7 w-7 p-0"
												title="Copy short URL"
											>
												<Copy className="h-3 w-3" />
											</Button>
											<Button
												variant="ghost"
												size="sm"
												onClick={() =>
													openURL(url.alias)
												}
												className="h-7 w-7 p-0"
												title="Open URL"
											>
												<ExternalLink className="h-3 w-3" />
											</Button>
										</div>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			)}
		</div>
	);
}
