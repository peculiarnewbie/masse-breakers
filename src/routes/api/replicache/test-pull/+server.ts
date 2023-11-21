import { json } from "@sveltejs/kit";
import { db } from "$lib/drizzle/dbClient";

export async function POST({ request }) {
	return json({});
}
