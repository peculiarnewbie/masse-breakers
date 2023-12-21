<script lang="ts">
	import "$lib/app.css";
	import {
		CredentialProvider,
		TopicClient,
		TopicConfigurations,
		TopicItem
	} from "@gomomento/sdk-web";
	import { onMount } from "svelte";

	let { data } = $props();

	let players: string[] = $state([]);
	let topicClient: TopicClient;

	console.log(data);

	const subscribeToPlayers = async () => {
		// token should be fetched from db now
		/* 
		const res = await fetch("/api/momento/getToken", {
			body: "",
			method: "POST"
		});
		const body = await res.json();

		console.log(body);
		*/

		try {
			if (data.token) {
				topicClient = new TopicClient({
					configuration: TopicConfigurations.Default.latest(),
					credentialProvider: CredentialProvider.fromString({ apiKey: data.token })
				});
			}
		} catch (e) {
			console.error(`Failed creating client with error: ${JSON.stringify(e)}`);
			throw e;
		}

		await topicClient.subscribe("masse-breakers", "players", {
			onError: () => {
				return;
			},

			onItem: (item: TopicItem) => {
				console.log(`poked about players`);
				const temp = [...players];
				temp.push("player");
				players = temp;
				return;
			}
		});

		const pub = await topicClient.publish("masse-breakers", "players", "p");

		console.log(pub);
	};

	onMount(() => {
		subscribeToPlayers();
	});
</script>

<div class="text-slate-200">
	<p>
		room: {data.roomName}
	</p>
	<p>role: {data.role}</p>

	<div class="flex flex-col rounded-md bg-slate-800 p-2">
		{#each players as player}
			<p>{player}</p>
		{/each}
	</div>
</div>
