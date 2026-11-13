import {
	BookOpen,
	ChartSpline,
	Home,
	Link2,
	Zap,
} from "lucide-react";
import { NavMain } from "./nav-main";
import { NavSecondary } from "./nav-secondary";
import { NavUser } from "./nav-user";
import { useAuth } from "~/contexts/AuthContext";

interface RecentEntry {
	alias: string;
	longURL: string;
	createTime: string;
}
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "./ui/sidebar";

const data = {
	navMain: [
		{
			title: "Home",
			url: "/",
			icon: Home,
		},
		{
			title: "Stats",
			url: "/stats",
			icon: ChartSpline,
		},
		{
			title: "How it works?",
			url: "/about",
			icon: BookOpen,
		},
	],
	navSecondary: [],
};

export function AppSidebar({
	setRecents,
	...props
}: React.ComponentProps<typeof Sidebar> & {
	setRecents: React.Dispatch<React.SetStateAction<RecentEntry[]>>;
}) {
	const { isAuthenticated } = useAuth();
	const navMain = isAuthenticated
		? [
				...data.navMain.slice(0, 2),
				{ title: "My Links", url: "/my-links", icon: Link2 },
				...data.navMain.slice(2),
			]
		: data.navMain;

	return (
		<Sidebar collapsible="icon" {...props}>
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton
							asChild
							className="data-[slot=sidebar-menu-button]:!p-1.5"
						>
							<a href="/">
								<Zap className="!size-5" />
								<span className="text-base font-semibold">
									Short URL
								</span>
							</a>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				<NavMain items={navMain} setRecents={setRecents} />
				<NavSecondary items={data.navSecondary} className="mt-auto" />
			</SidebarContent>
			<SidebarFooter>
				<NavUser />
			</SidebarFooter>
		</Sidebar>
	);
}
