<script lang="ts">
	import "../../app.css";
	import { Replicache, type WriteTransaction } from "replicache";
	import { env } from "$env/dynamic/public";
	import { onMount } from "svelte";
	import type { Message, MessageWithID } from "$lib/types";
	import { nanoid } from "nanoid";

	let rep: Replicache;
	let name = "dbName";
	let sharedList = [] as [string, Message][];

	let userValue = "";
	let messageValue = "";

	let websocket: WebSocket;

	const submitMessage = (e: SubmitEvent) => {
		e.preventDefault();

		const last = sharedList.length && sharedList[sharedList.length - 1][1];
		const order = (last?.order ?? 0) + 1;

		rep.mutate.createMessage({
			id: nanoid(),
			from: userValue,
			content: messageValue,
			order: order
		});
		messageValue = "";
	};

	const tryWebsocket = async () => {
		const response = await (
			await fetch("/api/replicache/test-socket", {
				method: "POST",
				headers: {
					Upgrade: "websocket"
				}
			})
		).json();

		websocket = response.webSocket;

		if (websocket) {
			websocket.addEventListener("message", (event) => {
				console.log("Message received from server");
				console.log(event.data);
			});
			websocket.send("MESSAGE");
		}
	};

	onMount(() => {
		rep = new Replicache({
			name: "chat-user-id",
			licenseKey: env.PUBLIC_REPLICACHE_LICENSE_KEY ?? "empty",
			pushURL: "/api/replicache/test-push",
			pullURL: "/api/replicache/test-pull",
			mutators: {
				async createMessage(tx: WriteTransaction, { id, from, content, order }: MessageWithID) {
					await tx.put(`message/${id}`, {
						from,
						content,
						order
					});
				}
			}
		});

		name = rep.idbName;

		rep.subscribe(
			async (tx) =>
				(await tx.scan({ prefix: "message/" }).entries().toArray()) as [string, Message][],
			{
				onData: (list) => {
					list.sort(([, { order: a }], [, { order: b }]) => a - b);
					sharedList = list;
				}
			}
		);

		return () => {
			websocket.close();
			rep.close();
		};
	});
</script>

<div class="flex flex-col gap-2 text-slate-200">
	{name}
	<button class="w-64 rounded-md bg-slate-800 p-2" on:click={tryWebsocket}>Connect Websocket</button
	>
	<form on:submit={submitMessage} class="flex gap-3">
		<input class="rounded-md p-2 text-slate-800" type="text" bind:value={userValue} />
		<input class="rounded-md p-2 text-slate-800" type="text" bind:value={messageValue} />
		<button>Post</button>
	</form>
	{#each sharedList as [item, message]}
		<div class="flex">
			<b>{message.from}: </b>
			{message.content}
		</div>
	{/each}
</div>
