<script lang="ts">
	import { onMount } from "svelte";
	import "../app.css";

	let personName: string = "";
	let warning: string = "";

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

	const createRoom = async () => {
		const result = await fetch("../api/createRoom", {
			method: "POST"
		});

		console.log(result);
	};

	const joinRoom = async (e: SubmitEvent) => {
		e.preventDefault();
		if (personName == "Bolt" || personName == "bolt") {
			warning = "no u ain't";
			return;
		} else {
			warning = "";
		}

		document.cookie = `chatName=${personName};`;
		window.location.href = "/byob";
	};

	onMount(() => {
		let cookie = document.cookie;
		let personName = getCookie(cookie);
	});
</script>

<div class="h-screen w-screen bg-black p-12 text-slate-200">
	<h1>Enter your name</h1>
	<!--
	-->

	{#if warning != ""}
		<p class=" text-red-400">{warning}</p>
	{/if}
	<form on:submit={joinRoom}>
		<input
			class="rounded-md p-2 text-slate-600"
			type="text"
			name="chatName"
			bind:value={personName}
		/>
		<button class="rounded-md bg-slate-800 px-6 py-2"> Chat Room </button>
	</form>
</div>
