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

	let chatWindow: HTMLElement;

	function getCookie(cname: string) {
		let name = cname + "=";
		let decodedCookie = decodeURIComponent(document.cookie);
		let ca = decodedCookie.split(";");
		for (let i = 0; i < ca.length; i++) {
			let c = ca[i];
			while (c.charAt(0) == " ") {
				c = c.substring(1);
			}
			if (c.indexOf(name) == 0) {
				return c.substring(name.length, c.length);
			}
		}
		return "";
	}

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

		setTimeout(() => {
			chatWindow.scrollTop = chatWindow.scrollHeight;
		}, 100);
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

		setInterval(() => {
			rep.pull();
		}, 2000);

		userValue = getCookie("chatName");

		setTimeout(() => {
			chatWindow.scrollTop = chatWindow.scrollHeight;
		}, 100);

		return () => {
			websocket.close();
			rep.close();
		};
	});

	const scrollDown = () => {
		chatWindow.scrollTop = chatWindow.scrollHeight;
	};
</script>

<div class="flex w-screen flex-col items-center justify-center gap-2 text-slate-200">
	{name}
	<div bind:this={chatWindow} class="h-[800px] w-96 overflow-y-scroll rounded-lg bg-slate-800">
		<div class="flex w-full flex-col gap-4 p-4">
			{#each sharedList as [item, message]}
				<div class={` w-64  ${userValue == message.from ? " self-end" : "self-start"}`}>
					<p class="text-sm">{message.from}</p>
					<p class="rounded-md bg-slate-600 p-2">{message.content}</p>
				</div>
			{/each}
		</div>
	</div>
	<!--
	<form on:submit={submitMessage} class="flex gap-3">
		<input class="w-80 rounded-md p-2 text-slate-800" type="text" bind:value={messageValue} />
			
		<button>Send</button>
	</form>
-->
	<button on:click={scrollDown}>scroll</button>
</div>
