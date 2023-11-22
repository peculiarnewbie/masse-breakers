import { json, type RequestEvent } from "@sveltejs/kit";
import Pusher from "pusher";

export async function POST({ request }: RequestEvent) {
	const pusher = new Pusher({
		appId: "c1a6bd3b-37d7-4f68-a512-6161d3df60d2",
		key: "fa999d6f-612a-4577-9f48-9473b0ef5341",
		secret: "amcgUDpmh8FUPdKo9GFwMNcRMnpufcqW",
		useTLS: true,
		host: "masse-breakers-soketi-b9b39028-96c8-4219-8174-0e0683c1177f.peculiarnewbie.workers.dev",
		port: "443"
	});

	const t0 = Date.now();
	await pusher.trigger("chat", "poke", {});
	console.log("Sent poke in", Date.now() - t0);

	return json({});
}
