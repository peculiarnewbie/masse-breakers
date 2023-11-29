import { json } from "@sveltejs/kit";
import { db } from "$lib/drizzle/dbClient";
import { replicache_space, rps_room } from "$lib/drizzle/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { MOMENTO_LAMBDA_FUNCTION_URL } from "$env/static/private";

export async function POST({ request, cookies }) {
	let status = 500;
	const t0 = Date.now();
	const body = await request.json();

	const room = await db.select().from(rps_room).where(eq(rps_room.roomName, body.roomName));

	let space: (typeof replicache_space.$inferSelect)[] = [];
	let foundRoom: (typeof rps_room.$inferSelect)[] = [];

	if (room[0]) {
		foundRoom = room;

		if (foundRoom[0].canJoin) {
			// get all state

			space = await db
				.select()
				.from(replicache_space)
				.where(eq(replicache_space.id, room[0].spaceId));
		} else {
			// room isn't joinable
		}
	} else {
		// create room
		const spaceToInsert = {
			id: nanoid(),
			version: 0
		};
		space = await db.insert(replicache_space).values(spaceToInsert).returning();

		// get key from lambda function
		let pubsubToken: string = "";

		const postBody = {
			room: body.roomName
		};

		const resp = await fetch(MOMENTO_LAMBDA_FUNCTION_URL, {
			method: "POST",
			headers: { "content-type": "application/json" },
			body: JSON.stringify(postBody)
		});

		pubsubToken = (await resp.json()).token;

		console.log("token object from lambda: ", pubsubToken);

		// if room is rps
		const roomToInsert = {
			id: nanoid(),
			roomName: body.roomName,
			adminId: body.userId,
			spaceId: spaceToInsert.id,
			type: "rps",
			canJoin: 1,
			pubsubToken: pubsubToken,
			round: 0
		};
		foundRoom = await db.insert(rps_room).values(roomToInsert).returning();
		cookies.set("adminOf", space[0].id, { path: "/" });
		cookies.set("fromCreating", "true", { path: "/" });
		cookies.set("pubsubToken", roomToInsert.pubsubToken, { path: "/" });
	}

	if (foundRoom[0] && space[0]) {
		status = 200;
	}
	console.log("server", foundRoom[0].id, "in", Date.now() - t0);
	return json({ room: foundRoom[0], space: space[0] }, { status: status });
}
