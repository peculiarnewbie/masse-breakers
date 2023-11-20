<script lang="ts">
	import "../../../app.css";
	import { Replicache } from "replicache";
	import { env } from "$env/dynamic/public";
	import { onMount } from "svelte";

	let rep: Replicache;
	let name = "dbName";
	let sharedCount = 0;

	const add = async () => {
		console.log(rep.idbName);
		rep.mutate.increment(1);
	};

	onMount(() => {
		rep = new Replicache({
			name: "user42",
			licenseKey: env.PUBLIC_REPLICACHE_LICENSE_KEY ?? "empty",
			mutators: {
				increment: async (tx, delta) => {
					const prev = (await tx.get("count")) ?? 0;
					const next = prev + delta;
					await tx.put("count", next);
					return next;
				}
			}
		});
		console.log(env.PUBLIC_REPLICACHE_LICENSE_KEY, rep.idbName);
		name = rep.idbName;
		rep.subscribe(async (tx) => (await tx.get("count")) ?? 0, {
			onData: (count) => {
				sharedCount = count;
			}
		});

		return () => {
			rep.close();
		};
	});
</script>

<div class="flex flex-col text-slate-200">
	{name}
	<button on:click={add} class="bg-slate-800 px-6 py-2">increment</button>
	<p>count: {sharedCount}</p>
</div>
