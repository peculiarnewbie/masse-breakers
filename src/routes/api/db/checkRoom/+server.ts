import { json } from "@sveltejs/kit";
import { db } from "$lib/drizzle/dbClient";
import { replicache_space, rps_room } from "$lib/drizzle/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import {
	AuthClient,
	CredentialProvider,
	DisposableTokenScopes,
	ExpiresIn,
	GenerateDisposableToken
} from "@gomomento/sdk";
import { MOMENTO_API_KEY } from "$env/static/private";

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

		// create momento disposable token
		const authClient = new AuthClient({
			credentialProvider: CredentialProvider.fromString({ apiKey: MOMENTO_API_KEY })
		});

		let pubsubToken: string = "";

		const oneKeyOneCacheToken = await authClient.generateDisposableToken(
			// minutes should change according to game type
			// topic name should be room name
			DisposableTokenScopes.topicPublishSubscribe("masse-breakers", "players"),
			ExpiresIn.minutes(30)
		);
		if (oneKeyOneCacheToken instanceof GenerateDisposableToken.Success) {
			console.log(
				'Generated a disposable API key with access to the "players" key in the "masse-breakers" cache!'
			);
			// logging only a substring of the tokens, because logging security credentials is not advisable :)
			console.log(`API key starts with: ${oneKeyOneCacheToken.authToken.substring(0, 10)}`);
			console.log(`Expires At: ${oneKeyOneCacheToken.expiresAt.epoch()}`);
			pubsubToken = oneKeyOneCacheToken.authToken;
		} else if (oneKeyOneCacheToken instanceof GenerateDisposableToken.Error) {
			throw new Error(
				`An error occurred while attempting to call generateApiKey with disposable token scope: ${oneKeyOneCacheToken.errorCode()}: ${oneKeyOneCacheToken.toString()}`
			);
		}

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
