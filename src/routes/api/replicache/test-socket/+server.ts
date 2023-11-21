import { json, type RequestEvent } from "@sveltejs/kit";

class WebSocketPair {
	0: WebSocket;
	1: WebSocket;
}

export async function POST({ request }: RequestEvent) {
	const upgradeHeader = request.headers.get("Upgrade");

	if (!upgradeHeader || upgradeHeader !== "websocket") {
		return json("Expected Upgrade: websocket", { status: 426 });
	}

	const webSocketPair = new WebSocketPair();
	const [client, server] = Object.values(webSocketPair);

	server.accept();
	server.addEventListener("message", (event) => {
		console.log(event.data);
	});

	return json({ webSocket: client }, { status: 101 });
}
