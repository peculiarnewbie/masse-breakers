<script lang="ts">
	import "../../app.css";
	import {
		Replicache,
		dropAllDatabases,
		type WriteTransaction,
		version,
		type ReadTransaction
	} from "replicache";
	import { env } from "$env/dynamic/public";
	import { onMount } from "svelte";
	import type { Message, MessageWithID } from "$lib/types";
	import { nanoid } from "nanoid";
	import { PUBLIC_SOKETI_PUSHER_HOST, PUBLIC_SOKETI_PUSHER_KEY } from "$env/static/public";
	import Pusher from "pusher-js";
	import { text } from "@sveltejs/kit";

	let rep: Replicache;
	let name = "dbName";
	let sharedList = [] as [string, Message][];

	let userValue = "";
	let messageValue = "";

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

	const submitMessage = async (e: SubmitEvent) => {
		e.preventDefault();

		const last = sharedList.length && sharedList[sharedList.length - 1][1];
		const order = (last?.order ?? 0) + 1;

		const lastDeleted = (await rep.query(
			async (tx: ReadTransaction) => await tx.get("last_deleted")
		)) as number | undefined;

		rep.mutate.createMessage({
			id: nanoid(),
			from: userValue,
			content: messageValue,
			order: order,
			version: lastDeleted ? lastDeleted + 1 : 1
		});
		messageValue = "";

		setTimeout(() => {
			chatWindow.scrollTop = chatWindow.scrollHeight;
		}, 100);
	};

	const clearAll = async () => {
		/*
		sharedList.forEach((message) => {
			rep.mutate.deleteMessage({ id: message[0] });
		});
		*/
		const lastDeleted = (await rep.query(
			async (tx: ReadTransaction) => await tx.get("last_deleted")
		)) as number | undefined;
		console.log("lastDeleted: ", lastDeleted);
		rep.mutate.deleteMessage(lastDeleted ? lastDeleted + 1 : 0);
	};

	const checkDeletion = async (lastDeleted: number) => {
		console.log("checking deletion");
		await rep.mutate.manualDelete(lastDeleted);
	};

	onMount(() => {
		rep = new Replicache({
			name: "chat-user-id",
			licenseKey: env.PUBLIC_REPLICACHE_LICENSE_KEY ?? "empty",
			pushURL: "/api/replicache/test-push",
			pullURL: "/api/replicache/test-pull",
			mutators: {
				async createMessage(
					tx: WriteTransaction,
					{ id, from, content, order, version }: MessageWithID
				) {
					await tx.put(`message/${id}`, {
						from,
						content,
						order,
						version
					});
				},
				async deleteMessage(tx: WriteTransaction, update: number) {
					await tx.put(`last_deleted`, update);
				},
				async manualDelete(tx: WriteTransaction, update: number) {
					const tasks: Promise<boolean>[] = [];
					sharedList.forEach(([id, message]) => {
						console.log("evaluating message: ", message.version, " vs lastDeleted: ", update);
						if (message.version <= update) {
							console.log("deleted message ", id);
							tasks.push(tx.del(id));
						}
					});
					const deleteResult = await Promise.all(tasks);
					console.log("deleteResult: ", deleteResult);
				}
			}
		});

		if (rep) {
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

			rep.subscribe(async (tx) => await tx.get("last_deleted"), {
				onData: (update) => {
					if (update) {
						console.log("update last deleted: ", update);
						checkDeletion(update);
					}
				}
			});

			console.log("listening");

			const pusher = new Pusher(PUBLIC_SOKETI_PUSHER_KEY, {
				wsHost: PUBLIC_SOKETI_PUSHER_HOST,
				cluster: "Replichat",
				forceTLS: true,
				disableStats: true,
				enabledTransports: ["ws", "wss"]
			});
			const channel = pusher.subscribe("chat");
			channel.bind("poke", () => {
				console.log("got poked");
				rep.pull();
			});
			userValue = getCookie("chatName");

			setTimeout(() => {
				chatWindow.scrollTop = chatWindow.scrollHeight;
			}, 100);
		}
	});
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
	<form on:submit={submitMessage} class="flex gap-3">
		<input class="w-80 rounded-md p-2 text-slate-800" type="text" bind:value={messageValue} />

		<button>Send</button>
	</form>
	<button on:click={clearAll}>clear</button>
</div>
