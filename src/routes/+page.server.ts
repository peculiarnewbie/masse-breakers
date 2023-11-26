import { json } from "@sveltejs/kit";
import { db } from "$lib/drizzle/dbClient";
import {
	replicache_space,
	rps_room,
	type ReplicacheSpace,
	type RPSRoom
} from "$lib/drizzle/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

export const actions = {
	default: async ({ cookies, request }) => {
		let status = 500;
		const t0 = Date.now();
		const data = await request.formData();

		const roomName = data.get("roomName") as string;
		const userId = data.get("userId") as string;

		const room = await db.select().from(rps_room).where(eq(rps_room.roomName, roomName));

		let space: ReplicacheSpace[];
		let foundRoom: RPSRoom[];
		if (room[0]) {
			foundRoom = room;

			// get all state

			space = await db
				.select({
					id: replicache_space.id,
					type: replicache_space.type,
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
				roomName: roomName,
				adminId: userId,
				spaceId: spaceToInsert.id,
				type: "rps",
				round: 0
			};
			foundRoom = await db.insert(rps_room).values(roomToInsert).returning();
		}

		if (foundRoom[0] && space[0]) {
			status = 200;
			cookies.set("mutate", "true");
		}

		console.log("server", foundRoom[0].id, "in", Date.now() - t0);
		return json({ room: foundRoom[0], space: space[0] }, { status: status });
	}
};
