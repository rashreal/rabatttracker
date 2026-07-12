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

	const quickFills = [
		{ name: 'Skyr', brand: 'Arla' },
		{ name: 'Mineralwasser', brand: 'Rosbacher' },
		{ name: 'Schokomüsli', brand: 'Vitalis' }
	];

	let name = $state('');
	let brand = $state('');
	let sizeHint = $state('');

	let searching = $state(false);
	let searchError = $state('');
	let groups = $state<ProductGroup[]>([]);
	let addedKeys = $state(new Set<string>());
	let addingKey = $state('');

	let manualAdding = $state(false);
	let manualAdded = $state(false);
	let manualError = $state('');

	function applyQuickFill(qf: { name: string; brand: string }) {
		name = qf.name;
		brand = qf.brand;
	}

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

	async function runSearch() {
		if (!name.trim() && !brand.trim()) {
			searchError = 'Bitte Produktname oder Marke eingeben.';
			return;
		}
		searching = true;
		searchError = '';
		manualAdded = false;
		groups = [];
		try {
			const q = [brand, name]
				.map((s) => s.trim())
				.filter(Boolean)
				.join(' ');
			const res = await fetch(`/api/marktguru/search?q=${encodeURIComponent(q)}`);
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

	async function addFromSearch(group: ProductGroup) {
		addingKey = group.key;
		try {
			const res = await fetch('/api/watchlist', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					displayName: group.productName,
					matchQuery: [brand, name].map((s) => s.trim()).filter(Boolean).join(' '),
					matchBrand: group.brand,
					matchProductId: group.sourceProductId,
					matchDescriptionKey: `${(group.brand ?? '').toLowerCase()}|${group.productName.toLowerCase()}`,
					matchSizeHint: sizeHint.trim() || null
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

	async function addManual() {
		if (!name.trim()) {
			manualError = 'Produktname ist erforderlich.';
			return;
		}
		manualAdding = true;
		manualError = '';
		try {
			const res = await fetch('/api/watchlist', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					displayName: name.trim(),
					matchQuery: name.trim(),
					matchBrand: brand.trim() || null,
					matchProductId: null,
					matchSizeHint: sizeHint.trim() || null
				})
			});
			if (!res.ok) throw new Error('Hinzufügen fehlgeschlagen');
			manualAdded = true;
		} catch (e) {
			manualError = e instanceof Error ? e.message : 'Fehler beim Hinzufügen';
		} finally {
			manualAdding = false;
		}
	}
</script>

<svelte:head>
	<title>Produkt hinzufügen – RabattTracker</title>
</svelte:head>

<div class="page">
	<h1>Produkt hinzufügen</h1>

	<section class="card">
		<div class="field-row">
			<div>
				<label for="name">Produktname</label>
				<input id="name" type="text" bind:value={name} placeholder="z.B. Skyr" />
			</div>
			<div>
				<label for="brand">Marke (optional)</label>
				<input id="brand" type="text" bind:value={brand} placeholder="z.B. Arla" />
			</div>
		</div>
		<div style="margin-top: 0.75rem; max-width: 260px">
			<label for="sizeHint">Größe (optional, nur zur eigenen Erinnerung)</label>
			<input id="sizeHint" type="text" bind:value={sizeHint} placeholder="z.B. 1 kg oder 12x1L" />
		</div>
		<div class="field-row" style="margin-top: 0.6rem; flex-wrap: wrap">
			{#each quickFills as qf (qf.name)}
				<button onclick={() => applyQuickFill(qf)}>{qf.brand} {qf.name}</button>
			{/each}
		</div>
		<div class="field-row" style="margin-top: 0.75rem">
			<button onclick={runSearch} disabled={searching}>
				{searching ? 'Suche…' : '🔍 Vorschläge suchen'}
			</button>
			<button class="primary" onclick={addManual} disabled={manualAdding}>
				{manualAdding ? '…' : '+ Direkt beobachten (ohne Suche)'}
			</button>
		</div>
		<p class="hint">
			<strong>Vorschläge suchen</strong> zeigt dir passende Produkte aus Marktguru's aktuellen Angeboten
			zum Anklicken. <strong>Direkt beobachten</strong> speichert Name/Marke ohne Suche - nützlich,
			wenn das Produkt gerade nirgends im Angebot ist (die Zuordnung beim Abgleich ist dann etwas
			unschärfer, siehe Marke).
		</p>
		{#if manualAdded}
			<p class="hint" style="color: var(--good)">Direkt hinzugefügt.</p>
		{/if}
		{#if manualError}
			<p class="hint" style="color: var(--bad)">{manualError}</p>
		{/if}
	</section>

	{#if searchError}
		<p class="hint" style="color: var(--bad)">{searchError}</p>
	{/if}

	{#each groups as group (group.key)}
		<div class="card" style="display:flex; justify-content: space-between; align-items:center; gap: 1rem">
			<div>
				<strong>{group.productName}</strong>
				{#if group.brand}<span class="hint"> · {group.brand}</span>{/if}
				{#if group.sample.unitText}<span class="hint"> · {group.sample.unitText}</span>{/if}
				<div class="hint">
					Referenz: {(group.sample.priceCents / 100).toFixed(2)} € bei {group.sample.retailerName}
					{#if group.retailerCount > 1}(+{group.retailerCount - 1} weitere Händler aktuell){/if}
				</div>
				<div class="hint">
					Wird danach bei <strong>jedem</strong> Händler in deinem Umkreis beobachtet, nicht nur bei
					{group.sample.retailerName}.
				</div>
			</div>
			{#if addedKeys.has(group.key)}
				<span class="badge good">Hinzugefügt</span>
			{:else}
				<button
					class="primary"
					onclick={() => addFromSearch(group)}
					disabled={addingKey === group.key}
				>
					{addingKey === group.key ? '…' : '+ Beobachten'}
				</button>
			{/if}
		</div>
	{/each}
</div>
