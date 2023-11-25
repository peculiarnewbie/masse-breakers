import { json } from "@sveltejs/kit";
import type { RequestEvent } from "./$types";
import { db } from "$lib/drizzle/dbClient";
import { rps_room } from "$lib/drizzle/schema";
import { eq } from "drizzle-orm";

export async function POST({ request }: RequestEvent) {
	const t0 = Date.now();

	const body = await request.json();
	console.log(body);
	const foundRoom = await db
		.select({ roomName: rps_room.roomName })
		.from(rps_room)
		.where(eq(rps_room.roomName, body.roomName));

	console.log("server", foundRoom, "in", Date.now() - t0);
	return json({ foundRoom });
}
