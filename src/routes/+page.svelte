<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
	let feed = $state(data.feed);
	let removingId = $state<number | null>(null);

	function formatEuro(cents: number) {
		return (cents / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
	}

	async function remove(id: number) {
		removingId = id;
		try {
			const res = await fetch(`/api/watchlist/${id}`, { method: 'DELETE' });
			if (res.ok) {
				feed = feed.filter((f) => f.product.id !== id);
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

	{#if feed.length === 0}
		<div class="card">
			<p>Noch keine Produkte beobachtet.</p>
			<a href="/watchlist/add"><button class="primary">Produkt hinzufügen</button></a>
		</div>
	{:else}
		{#each feed as item (item.product.id)}
			<div class="card">
				<div style="display:flex; justify-content: space-between; align-items:flex-start; gap: 1rem">
					<div>
						<a href={`/product/${item.product.id}`} style="text-decoration:none; color: inherit">
							<strong>{item.product.displayName}</strong>
						</a>
						{#if item.product.matchBrand}<span class="hint"> · {item.product.matchBrand}</span>{/if}
					</div>
					<button onclick={() => remove(item.product.id)} disabled={removingId === item.product.id}>
						{removingId === item.product.id ? '…' : 'Entfernen'}
					</button>
				</div>

				{#if item.currentOffers.length > 0}
					<div style="margin-top: 0.6rem; display:flex; align-items:center; gap:0.6rem; flex-wrap: wrap">
						<span style="font-size:1.3rem; font-weight:700">
							{formatEuro(item.currentOffers[0].priceCents)}
						</span>
						<span class="hint">bei {item.currentOffers[0].retailerName}</span>
						{#if item.indicator}
							<span class="badge {item.indicator.label === 'top' ? 'top' : item.indicator.label === 'good' ? 'good' : item.indicator.label === 'bad' ? 'bad' : 'normal'}">
								{item.indicator.displayText}
							</span>
						{/if}
						{#if item.currentOffers.length > 1}
							<span class="hint">+{item.currentOffers.length - 1} weitere Angebote</span>
						{/if}
					</div>
					{#if item.indicator && item.indicator.avgCents != null}
						<p class="hint">
							Ø {formatEuro(item.indicator.avgCents)} · Min {formatEuro(item.indicator.minCents ?? 0)} ·
							Max {formatEuro(item.indicator.maxCents ?? 0)} (letzte 180 Tage, {item.indicator.sampleCount}
							Beobachtungen)
						</p>
					{/if}
				{:else}
					<p class="hint" style="margin-top:0.5rem">Aktuell kein Angebot bekannt.</p>
				{/if}
			</div>
		{/each}
		<a href="/watchlist/add"><button>+ Weiteres Produkt</button></a>
	{/if}
</div>
