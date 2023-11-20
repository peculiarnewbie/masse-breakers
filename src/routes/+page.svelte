<script lang="ts">
	import "../app.css";

	let roomName: string = "default";

	const createRoom = async () => {
		const result = await fetch("../api/createRoom", {
			method: "POST"
		});

		console.log(result);
	};
</script>

<div class="h-screen w-screen bg-black text-slate-200">
	<h1>Welcome to SvelteKit</h1>
	<p>Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation</p>

	<input class="rounded-md p-2 text-slate-600" type="text" bind:value={roomName} />
	<button on:click={createRoom} class="rounded-md bg-slate-800 px-6 py-2"> Create Room </button>
</div>
