import { db } from "$lib/drizzle/dbClient.js";
import { rps_room } from "$lib/drizzle/schema.js";
import { json } from "@sveltejs/kit";
import { eq } from "drizzle-orm";

export async function load({ params, cookies }) {
	const roomName = params.slug;
	let role: string;

	if (cookies.get("fromCreating")) {
		console.log("skipping auth");
		role = "admin";
	} else {
		const room = await db.select().from(rps_room).where(eq(rps_room.roomName, roomName));
		if (cookies.get("adminOf") == room[0].spaceId) {
			console.log("yea you are admin");
			role = "admin";
		} else {
			console.log("filty player");
			role = "player";
		}
	}

	return { roomName: roomName, role: role };
}
