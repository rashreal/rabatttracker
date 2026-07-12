<script lang="ts">
	import { Line } from 'svelte-chartjs';
	import {
		Chart as ChartJS,
		Title,
		Tooltip,
		Legend,
		LineElement,
		LinearScale,
		PointElement,
		CategoryScale
	} from 'chart.js';
	import type { PageData } from './$types';

	ChartJS.register(Title, Tooltip, Legend, LineElement, LinearScale, PointElement, CategoryScale);

	let { data }: { data: PageData } = $props();

	function formatEuro(cents: number) {
		return (cents / 100).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
	}

	const chronological = [...data.observations].reverse();

	const chartData = {
		labels: chronological.map((o) => o.observedAt.slice(0, 10)),
		datasets: [
			{
				label: 'Preis (€)',
				data: chronological.map((o) => o.priceCents / 100),
				borderColor: '#2563eb',
				backgroundColor: '#2563eb33',
				tension: 0.15,
				pointRadius: 3
			}
		]
	};

	const chartOptions = {
		responsive: true,
		plugins: { legend: { display: false } },
		scales: {
			y: { beginAtZero: false, ticks: { callback: (v: number | string) => `${v} €` } }
		}
	};

	let removing = $state(false);
	async function remove() {
		removing = true;
		const res = await fetch(`/api/watchlist/${data.product.id}`, { method: 'DELETE' });
		if (res.ok) window.location.href = '/';
		else removing = false;
	}
</script>

<svelte:head>
	<title>{data.product.displayName} – RabattTracker</title>
</svelte:head>

<div class="page">
	<a href="/">&larr; Zurück</a>
	<h1>{data.product.displayName}</h1>
	{#if data.product.matchBrand}<p class="hint">{data.product.matchBrand}</p>{/if}

	{#if data.indicator}
		<section class="card">
			<span
				class="badge {data.indicator.label === 'top'
					? 'top'
					: data.indicator.label === 'good'
						? 'good'
						: data.indicator.label === 'bad'
							? 'bad'
							: 'normal'}"
			>
				{data.indicator.displayText}
			</span>
			{#if data.indicator.avgCents != null}
				<p class="hint" style="margin-top: 0.5rem">
					Letzter Preis {formatEuro(data.observations[0].priceCents)} · Ø {formatEuro(
						data.indicator.avgCents
					)} · Min {formatEuro(data.indicator.minCents ?? 0)} · Max {formatEuro(
						data.indicator.maxCents ?? 0
					)}
					(letzte 180 Tage, {data.indicator.sampleCount} Beobachtungen)
				</p>
			{/if}
		</section>
	{/if}

	{#if data.observations.length > 0}
		<section class="card">
			<h2>Preisverlauf</h2>
			<Line data={chartData} options={chartOptions} />
		</section>

		<section class="card">
			<h2>Alle Beobachtungen</h2>
			<table style="width:100%; border-collapse: collapse">
				<thead>
					<tr style="text-align:left; border-bottom: 1px solid var(--border)">
						<th>Datum</th>
						<th>Händler</th>
						<th>Preis</th>
						<th>Gültig</th>
					</tr>
				</thead>
				<tbody>
					{#each data.observations as o (o.id)}
						<tr style="border-bottom: 1px solid var(--border)">
							<td>{o.observedAt.slice(0, 10)}</td>
							<td>{o.retailerName}</td>
							<td>{formatEuro(o.priceCents)}</td>
							<td>{o.validFrom} – {o.validTo}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</section>
	{:else}
		<div class="card">
			<p>Noch keine Preisdaten. Führe einen Abgleich aus (Einstellungen → Angebots-Abgleich).</p>
		</div>
	{/if}

	<button onclick={remove} disabled={removing}>
		{removing ? '…' : 'Aus Watchlist entfernen'}
	</button>
</div>
