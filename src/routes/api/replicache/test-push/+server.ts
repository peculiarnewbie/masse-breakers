import { client, db, serverId } from "$lib/drizzle/dbClient";
import { replicache_client, replicache_server, test_messages } from "$lib/drizzle/schema";

import type { MessageWithID } from "$lib/types";
import { json } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import type { MutationV1, PushRequest, PushRequestV1 } from "replicache";

export async function POST({ request }) {
	const push: PushRequestV1 = await request.json();

	console.log("processing push", JSON.stringify(push));

	const t0 = Date.now();
	try {
		for (const mutation of push.mutations) {
			const t1 = Date.now();
			const groupId = push.clientGroupID;

			try {
				const clientId = mutation.clientID;

				await db.transaction(async (tx) => {
					const [prevVersion] = await db
						.select()
						.from(replicache_server)
						.where(eq(replicache_server.id, serverId));
					const nextVersion = prevVersion.version ? prevVersion.version + 1 : 1;

					const clientRow = await db
						.select({ lastMutationId: replicache_client.last_mutation_id })
						.from(replicache_client)
						.where(eq(replicache_client.id, clientId));

					console.log("tf man", clientRow);
					let lastMutationId = 0;
					if (clientRow[0]) lastMutationId = clientRow[0].lastMutationId;

					const nextMutationId = lastMutationId + 1;

					console.log("nextVersion", nextVersion, "nextMutationID", nextMutationId);

					if (mutation.id < nextMutationId) {
						console.log(`Mutation ${mutation.id} has already been processed - skipping`);
						return;
					}

					if (mutation.id > nextMutationId) {
						throw new Error(
							`Mutation ${mutation.id} is from the future - aborting. This can happen in development if the server restarts. In that case, clear appliation data in browser and refresh.`
						);
					}

					console.log("Processing mutation:", JSON.stringify(mutation));

					let args = mutation.args as MessageWithID;

					switch (mutation.name) {
						case "createMessage":
							await db.insert(test_messages).values({
								id: args.id,
								sender: args.from,
								content: args.content,
								order: args.order,
								deleted: 0,
								version: nextVersion
							});
							break;
						default:
							throw new Error(`Unknown mutation: ${mutation.name}`);
					}

					console.log("setting", clientId, "last_mutation_id to", nextMutationId);

					const mutated = await db
						.update(replicache_client)
						.set({
							client_group_id: groupId,
							last_mutation_id: nextMutationId,
							version: nextVersion
						})
						.where(eq(replicache_client.id, clientId))
						.returning();

					if (mutated.length === 0) {
						await db.insert(replicache_client).values({
							id: clientId,
							client_group_id: groupId,
							last_mutation_id: nextMutationId,
							version: nextVersion
						});
					}

					await db.update(replicache_server).set({ version: nextVersion });
				});
			} catch (e) {
				console.error("Caught error from mutation", mutation, e);
			}
		}

		return json({});
	} catch (e) {
		console.error(e);
		return json({}, { status: 500 });
	} finally {
		console.log("Processed push in ", Date.now() - t0);
	}
}