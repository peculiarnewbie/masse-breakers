<script lang="ts">
	import { goto } from "$app/navigation";
	import "$lib/app.css";

	let roomInput = $state("");
	let isSendingRoom = $state(false);

	let { data, form } = $props();

	const createRoom = () => {
		isSendingRoom = true;
	};

	const joinRoom = async () => {
		const request = {
			roomName: roomInput,
			userId: "user"
		};
		const result = await fetch("/api/db/checkRoom", {
			body: JSON.stringify(request),
			method: "POST"
		});

		const body = await result.json();
		const room = body.room;
		console.log(body);

		isSendingRoom = false;

		goto(`/${room.type}/${room.roomName}`);
	};
</script>

<div
	class="flex h-screen w-screen flex-col items-center justify-center bg-black p-12 text-slate-200"
>
	<p>Enter room name</p>
	<div class="p-2" />
	<form
		method="POST"
		class={`flex h-24 w-full max-w-xs flex-col items-center transition-all duration-100 ${
			isSendingRoom ? "gap-0" : "gap-4"
		}`}
		on:submit={createRoom}
	>
		<input
			class={`w-full rounded-md p-2 text-center text-slate-800 transition-all duration-100 ${
				isSendingRoom ? "h-0 p-0 opacity-0" : "h-12 opacity-100"
			}`}
			type="text"
			name="roomName"
			bind:value={roomInput}
		/>
		<button
			class={` rounded-md bg-slate-800 px-4 py-2 transition-all duration-100 ${
				isSendingRoom ? "h-full w-full" : "h-fit w-24"
			}`}>{`${isSendingRoom ? "Joining..." : "Enter"}`}</button
		>
	</form>
	<div class="p-8" />
</div>
