import { json } from "@sveltejs/kit";
import type { RequestEvent } from "./$types";
import { db } from "$lib/drizzle/dbClient";
import {
	replicache_space,
	rps_room,
	type ReplicacheSpace,
	type RPSRoom
} from "$lib/drizzle/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export async function POST({ request }: RequestEvent) {
	let status = 500;
	const t0 = Date.now();
	const body = await request.json();

	const room = await db.select().from(rps_room).where(eq(rps_room.roomName, body.roomName));

	let space: ReplicacheSpace[];
	let foundRoom: RPSRoom[];
	if (room[0]) {
		foundRoom = room;

		// get all state

		space = await db
			.select({
				id: replicache_space.id,
				version: replicache_space.version
			})
			.from(replicache_space)
			.where(eq(replicache_space.id, room[0].spaceId));
	} else {
		// create room
		const spaceToInsert = {
			id: nanoid(),
			version: 0,
			type: "rps"
		};
		space = await db.insert(replicache_space).values(spaceToInsert).returning();

		// if room is rps
		const roomToInsert = {
			id: nanoid(),
			roomName: body.roomName,
			adminId: body.userId,
			spaceId: spaceToInsert.id,
			type: "rps",
			round: 0
		};
		foundRoom = await db.insert(rps_room).values(roomToInsert).returning();
	}

	if (foundRoom[0] && space[0]) status = 200;
	console.log("server", foundRoom[0].id, "in", Date.now() - t0);
	return json({ room: foundRoom[0], space: space[0] }, { status: status });