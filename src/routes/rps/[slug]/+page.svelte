<script lang="ts">
	import "$lib/app.css";

	export let data;

	console.log(data);
</script>

<div class="text-slate-200">
	<p>
		room: {data.roomName}
	</p>
	<p>role: {data.role}</p>
</div>
