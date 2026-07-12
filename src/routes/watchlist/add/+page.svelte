<script lang="ts">
	interface SearchResult {
		sourceOfferId: string;
		sourceProductId: number | null;
		productName: string;
		brand: string | null;
		description: string;
		retailerName: string;
		priceCents: number;
		unitText: string | null;
	}

	interface ProductGroup {
		key: string;
		productName: string;
		brand: string | null;
		sourceProductId: number | null;
		sample: SearchResult;
		retailerCount: number;
	}

	const quickSearches = ['Arla Skyr', 'Rosbacher Mineralwasser', 'Vitalis Schokomüsli'];

	let query = $state('');
	let searching = $state(false);
	let searchError = $state('');
	let groups = $state<ProductGroup[]>([]);
	let addedKeys = $state(new Set<string>());
	let addingKey = $state('');

	function groupResults(results: SearchResult[]): ProductGroup[] {
		const map = new Map<string, ProductGroup>();
		for (const r of results) {
			const key =
				r.sourceProductId != null
					? `pid:${r.sourceProductId}`
					: `desc:${(r.brand ?? '').toLowerCase()}|${r.productName.toLowerCase()}`;
			const existing = map.get(key);
			if (existing) {
				existing.retailerCount += 1;
			} else {
				map.set(key, {
					key,
					productName: r.productName,
					brand: r.brand,
					sourceProductId: r.sourceProductId,
					sample: r,
					retailerCount: 1
				});
			}
		}
		return [...map.values()];
	}

	async function runSearch(q: string) {
		query = q;
		if (!q.trim()) return;
		searching = true;
		searchError = '';
		groups = [];
		try {
			const res = await fetch(`/api/marktguru/search?q=${encodeURIComponent(q.trim())}`);
			if (!res.ok) {
				const body = await res.json().catch(() => ({ message: 'Suche fehlgeschlagen' }));
				throw new Error(body.message ?? 'Suche fehlgeschlagen');
			}
			const results: SearchResult[] = await res.json();
			groups = groupResults(results);
			if (groups.length === 0) searchError = 'Keine Treffer gefunden.';
		} catch (e) {
			searchError = e instanceof Error ? e.message : 'Fehler bei der Suche';
		} finally {
			searching = false;
		}
	}

	async function addProduct(group: ProductGroup) {
		addingKey = group.key;
		try {
			const res = await fetch('/api/watchlist', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					displayName: group.productName,
					matchQuery: query.trim(),
					matchBrand: group.brand,
					matchProductId: group.sourceProductId,
					matchDescriptionKey: `${(group.brand ?? '').toLowerCase()}|${group.productName.toLowerCase()}`
				})
			});
			if (!res.ok) throw new Error('Hinzufügen fehlgeschlagen');
			addedKeys = new Set([...addedKeys, group.key]);
		} catch (e) {
			searchError = e instanceof Error ? e.message : 'Fehler beim Hinzufügen';
		} finally {
			addingKey = '';
		}
	}
</script>

<svelte:head>
	<title>Produkt hinzufügen – RabattTracker</title>
</svelte:head>

<div class="page">
	<h1>Produkt hinzufügen</h1>

	<section class="card">
		<label for="q">Produkt suchen</label>
		<div class="field-row">
			<input
				id="q"
				type="text"
				bind:value={query}
				placeholder="z.B. Arla Skyr"
				onkeydown={(e) => e.key === 'Enter' && runSearch(query)}
			/>
			<button class="primary" onclick={() => runSearch(query)} disabled={searching}>
				{searching ? 'Suche…' : 'Suchen'}
			</button>
		</div>
		<div class="field-row" style="margin-top: 0.6rem; flex-wrap: wrap">
			{#each quickSearches as q (q)}
				<button onclick={() => runSearch(q)} disabled={searching}>{q}</button>
			{/each}
		</div>
		<p class="hint">
			Die Suche fragt live die Marktguru-Angebote für deine eingestellte PLZ ab. Funktioniert nur,
			wenn dein Standort in den <a href="/settings">Einstellungen</a> gesetzt ist und dieser Server
			echten Internetzugriff auf marktguru.de hat.
		</p>
	</section>

	{#if searchError}
		<p class="hint" style="color: var(--bad)">{searchError}</p>
	{/if}

	{#each groups as group (group.key)}
		<div class="card" style="display:flex; justify-content: space-between; align-items:center; gap: 1rem">
			<div>
				<strong>{group.productName}</strong>
				{#if group.brand}<span class="hint"> · {group.brand}</span>{/if}
				<div class="hint">
					{(group.sample.priceCents / 100).toFixed(2)} € bei {group.sample.retailerName}
					{#if group.retailerCount > 1}(+{group.retailerCount - 1} weitere){/if}
				</div>
			</div>
			{#if addedKeys.has(group.key)}
				<span class="badge good">Hinzugefügt</span>
			{:else}
				<button
					class="primary"
					onclick={() => addProduct(group)}
					disabled={addingKey === group.key}
				>
					{addingKey === group.key ? '…' : '+ Beobachten'}
				</button>
			{/if}
		</div>
	{/each}
</div>
