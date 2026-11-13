import { useEffect, useState } from "react";
import {
	getIndiaDateKey,
	millisecondsUntilNextIndiaDay,
} from "~/lib/india-date";

export function useIndiaToday(): string {
	const [today, setToday] = useState(() => getIndiaDateKey());

	useEffect(() => {
		const timeout = window.setTimeout(
			() => setToday(getIndiaDateKey()),
			millisecondsUntilNextIndiaDay()
		);
		return () => window.clearTimeout(timeout);
	}, [today]);

	return today;
}
