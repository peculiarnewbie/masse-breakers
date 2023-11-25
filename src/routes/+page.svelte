<script lang="ts">
	import "../app.css";

	let roomInput = $state("");
	let isSendingRoom = $state(false);

	const createRoom = () => {
		isSendingRoom = true;

		joinRoom();
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

		console.log(await result.json());

		isSendingRoom = false;
	};
</script>

<div
	class="flex h-screen w-screen flex-col items-center justify-center bg-black p-12 text-slate-200"
>
	<p>Enter room name</p>
	<div class="p-2" />
	<form
		class={`flex h-24 w-full flex-col items-center transition-all duration-100 ${
			isSendingRoom ? "gap-0" : "gap-4"
		}`}
		on:submit={createRoom}
	>
		<input
			class={`w-full rounded-md p-2 text-slate-800 transition-all duration-100 ${
				isSendingRoom ? "h-0 p-0 opacity-0" : "h-12 opacity-100"
			}`}
			type="text"
			bind:value={roomInput}
		/>
		<button
			class={` h-full rounded-md bg-slate-800 px-4 py-2 transition-all duration-100 ${
				isSendingRoom ? "w-full" : "w-24"
			}`}>{`${isSendingRoom ? "Joining..." : "Enter"}`}</button
		>
	</form>
	<div class="p-8" />
</div>
