import { json } from "@sveltejs/kit";
import { env } from "$env/dynamic/private";

export async function POST({ request }) {
	const result = await fetch(`${env.UPSTASH_REDIS_REST_URL}/set/foo/bar`, {
		headers: {
			Authorization: env.UPSTASH_REDIS_REST_TOKEN
		}
	});
	console.log(result);

	return json({ result });
}
