import { Router, Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Click } from "../entity/Click";
import { URL } from "../entity/URL";
import { getIndiaDateWindow, indiaDateSql } from "../india-date";
import {
	authenticateToken,
	AuthenticatedRequest,
} from "../middleware/authenticateToken";

const router = Router();
router.use(authenticateToken);

router.get("/", async (req: Request, res: Response): Promise<void> => {
	const userId = (req as AuthenticatedRequest).authUser?.id;
	if (!userId) {
		res.status(401).json({ error: "Authentication required" });
		return;
	}

	try {
		const links = await AppDataSource.getRepository(URL)
			.createQueryBuilder("url")
			.leftJoin("url.clicks", "click")
			.select([
				"url.alias AS alias",
				"url.longURL AS longURL",
				"url.createTime AS createTime",
				"COUNT(click.id) AS clicks",
			])
			.where("url.userId = :userId", { userId })
			.groupBy("url.alias")
			.addGroupBy("url.longURL")
			.addGroupBy("url.createTime")
			.orderBy("url.createTime", "DESC")
			.addOrderBy("url.alias", "DESC")
			.getRawMany();

		res.json(
			links.map((link) => ({ ...link, clicks: Number(link.clicks) }))
		);
	} catch (error) {
		console.error("My links route error:", error);
		res.status(500).json({ error: "Internal server error" });
	}
});

router.get(
	"/stats/:days",
	async (req: Request, res: Response): Promise<void> => {
		const userId = (req as AuthenticatedRequest).authUser?.id;
		const days = parseInt(req.params.days, 10);
		if (!userId) {
			res.status(401).json({ error: "Authentication required" });
			return;
		}
		if (isNaN(days) || days <= 0) {
			res.status(400).json({ error: "Invalid days parameter" });
			return;
		}

		try {
			const { dates, startUtc, endUtc } = getIndiaDateWindow(days);
			const dateExpression = indiaDateSql("click.clickTime");
			const counts: { date: string; count: string | number }[] =
				await AppDataSource.getRepository(Click)
					.createQueryBuilder("click")
					.innerJoin("click.url", "url")
					.select([
						`${dateExpression} AS date`,
						"COUNT(*) AS count",
					])
					.where("url.userId = :userId", { userId })
					.andWhere(
						"click.clickTime >= :startUtc AND click.clickTime < :endUtc",
						{ startUtc, endUtc }
					)
					.groupBy(dateExpression)
					.orderBy("date", "DESC")
					.getRawMany();

			const dataMap = new Map<string, number>();
			counts.forEach((item) => {
				dataMap.set(item.date, Number(item.count));
			});

			res.json(
				dates.map((date) => ({
					date,
					count: dataMap.get(date) || 0,
				}))
			);
		} catch (error) {
			console.error("My link stats route error:", error);
			res.status(500).json({ error: "Internal server error" });
		}
	}
);

router.delete("/:alias", async (req: Request, res: Response): Promise<void> => {
	const userId = (req as AuthenticatedRequest).authUser?.id;
	if (!userId) {
		res.status(401).json({ error: "Authentication required" });
		return;
	}

	try {
		const link = await AppDataSource.getRepository(URL).findOneBy({
			alias: req.params.alias,
			userId,
		});
		if (!link) {
			res.status(404).json({ error: "Link not found" });
			return;
		}

		await AppDataSource.transaction(async (manager) => {
			await manager.delete(Click, { alias: link.alias });
			await manager.delete(URL, { alias: link.alias, userId });
		});

		res.json({ success: true });
	} catch (error) {
		console.error("Delete my link route error:", error);
		res.status(500).json({ error: "Internal server error" });
	}
});

export default router;
