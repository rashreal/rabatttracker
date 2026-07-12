<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let watchlist = $state(data.watchlist);
	let removingId = $state<number | null>(null);

	async function remove(id: number) {
		removingId = id;
		try {
			const res = await fetch(`/api/watchlist/${id}`, { method: 'DELETE' });
			if (res.ok) {
				watchlist = watchlist.filter((w) => w.id !== id);
			}
		} finally {
			removingId = null;
		}
	}
</script>

<svelte:head>
	<title>RabattTracker</title>
</svelte:head>

<div class="page">
	<h1>Meine Watchlist</h1>

	{#if watchlist.length === 0}
		<div class="card">
			<p>Noch keine Produkte beobachtet.</p>
			<a href="/watchlist/add"><button class="primary">Produkt hinzufügen</button></a>
		</div>
	{:else}
		{#each watchlist as item (item.id)}
			<div class="card" style="display:flex; justify-content: space-between; align-items:center; gap: 1rem">
				<div>
					<strong>{item.displayName}</strong>
					{#if item.matchBrand}<span class="hint"> · {item.matchBrand}</span>{/if}
					<div class="hint">Angebots-Feed &amp; Preis-Historie folgen in Kürze.</div>
				</div>
				<button onclick={() => remove(item.id)} disabled={removingId === item.id}>
					{removingId === item.id ? '…' : 'Entfernen'}
				</button>
			</div>
		{/each}
		<a href="/watchlist/add"><button>+ Weiteres Produkt</button></a>
	{/if}
</div>
