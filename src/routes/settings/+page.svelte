<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let homeAddressText = $state(data.settings.homeAddressText ?? '');
	let homeZipCode = $state(data.settings.homeZipCode ?? '');
	let homeLat = $state(data.settings.homeLat);
	let homeLon = $state(data.settings.homeLon);
	let radiusKm = $state(data.settings.radiusKm);
	let notificationEnabled = $state(data.settings.notificationEnabled);
	let notifyOnNewOffer = $state(data.settings.notifyOnNewOffer);
	let notifyOnPriceDropOnly = $state(data.settings.notifyOnPriceDropOnly);
	let priceDropThresholdPct = $state(data.settings.priceDropThresholdPct);

	let geocoding = $state(false);
	let locating = $state(false);
	let saving = $state(false);
	let statusMessage = $state('');
	let statusIsError = $state(false);

	function showStatus(message: string, isError = false) {
		statusMessage = message;
		statusIsError = isError;
	}

	async function searchAddress() {
		if (!homeAddressText.trim() && !homeZipCode.trim()) {
			showStatus('Bitte PLZ oder Adresse eingeben.', true);
			return;
		}
		geocoding = true;
		showStatus('');
		try {
			const query = [homeAddressText, homeZipCode].filter(Boolean).join(', ');
			const res = await fetch('/api/geocode', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ query })
			});
			if (!res.ok) throw new Error((await res.json()).message ?? 'Geocoding fehlgeschlagen');
			const result = await res.json();
			homeLat = result.lat;
			homeLon = result.lon;
			showStatus(`Standort gefunden: ${result.displayName}`);
		} catch (e) {
			showStatus(e instanceof Error ? e.message : 'Fehler bei der Adresssuche', true);
		} finally {
			geocoding = false;
		}
	}

	function useGpsLocation() {
		if (!('geolocation' in navigator)) {
			showStatus('Geolocation wird von diesem Browser nicht unterstützt.', true);
			return;
		}
		locating = true;
		showStatus('');
		navigator.geolocation.getCurrentPosition(
			(pos) => {
				homeLat = pos.coords.latitude;
				homeLon = pos.coords.longitude;
				locating = false;
				showStatus('Standort per GPS übernommen.');
			},
			(err) => {
				locating = false;
				showStatus(`GPS fehlgeschlagen: ${err.message}`, true);
			},
			{ enableHighAccuracy: true, timeout: 10000 }
		);
	}

	async function save() {
		saving = true;
		showStatus('');
		try {
			const res = await fetch('/api/settings', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					homeAddressText,
					homeZipCode,
					homeLat,
					homeLon,
					radiusKm,
					notificationEnabled,
					notifyOnNewOffer,
					notifyOnPriceDropOnly,
					priceDropThresholdPct
				})
			});
			if (!res.ok) throw new Error('Speichern fehlgeschlagen');
			showStatus('Gespeichert.');
		} catch (e) {
			showStatus(e instanceof Error ? e.message : 'Fehler beim Speichern', true);
		} finally {
			saving = false;
		}
	}
</script>

<svelte:head>
	<title>Einstellungen – RabattTracker</title>
</svelte:head>

<div class="page">
	<h1>Einstellungen</h1>

	<section class="card">
		<h2>Standort &amp; Umkreis</h2>
		<div class="field-row">
			<div>
				<label for="address">Adresse</label>
				<input id="address" type="text" bind:value={homeAddressText} placeholder="Musterstraße 1, Musterstadt" />
			</div>
			<div>
				<label for="zip">PLZ</label>
				<input id="zip" type="text" bind:value={homeZipCode} placeholder="12345" />
			</div>
		</div>
		<div class="field-row" style="margin-top: 0.75rem">
			<button onclick={searchAddress} disabled={geocoding}>
				{geocoding ? 'Suche…' : 'Adresse suchen'}
			</button>
			<button onclick={useGpsLocation} disabled={locating}>
				{locating ? 'Ermittle…' : '📍 Meinen Standort verwenden'}
			</button>
		</div>
		{#if homeLat != null && homeLon != null}
			<p class="hint">Aktueller Standort: {homeLat.toFixed(5)}, {homeLon.toFixed(5)}</p>
		{:else}
			<p class="hint">Noch kein Standort gesetzt.</p>
		{/if}

		<div style="margin-top: 0.75rem">
			<label for="radius">Umkreis (km)</label>
			<input id="radius" type="number" min="1" max="100" bind:value={radiusKm} />
		</div>
	</section>

	<section class="card">
		<h2>Benachrichtigungen</h2>
		<label>
			<input type="checkbox" bind:checked={notificationEnabled} />
			Preisalarme aktiviert
		</label>
		<label style="margin-top: 0.5rem">
			<input type="checkbox" bind:checked={notifyOnNewOffer} />
			Bei jedem neuen Angebot benachrichtigen
		</label>
		<label style="margin-top: 0.5rem">
			<input type="checkbox" bind:checked={notifyOnPriceDropOnly} />
			Nur bei Preis-Einbruch benachrichtigen
		</label>
		{#if notifyOnPriceDropOnly}
			<div style="margin-top: 0.5rem; max-width: 200px">
				<label for="threshold">Schwelle (% unter Durchschnitt)</label>
				<input id="threshold" type="number" min="1" max="90" bind:value={priceDropThresholdPct} />
			</div>
		{/if}
		<p class="hint">
			Push-Benachrichtigungen selbst (Browser/iPhone) werden separat aktiviert, sobald das
			eingerichtet ist.
		</p>
	</section>

	<div class="field-row">
		<button class="primary" onclick={save} disabled={saving}>
			{saving ? 'Speichere…' : 'Speichern'}
		</button>
	</div>

	{#if statusMessage}
		<p class="hint" style={statusIsError ? 'color: var(--bad)' : 'color: var(--good)'}>
			{statusMessage}
		</p>
	{/if}
</div>
