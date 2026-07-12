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
	let scraping = $state(false);
	let subscribingPush = $state(false);
	let sendingTestPush = $state(false);
	let pushSubscribed = $state(false);
	let pushSupported = $state(false);
	let lastScrapeRun = $state(data.lastScrapeRun);
	let statusMessage = $state('');
	let statusIsError = $state(false);

	$effect(() => {
		pushSupported = 'serviceWorker' in navigator && 'PushManager' in window;
		if (pushSupported) {
			navigator.serviceWorker
				.getRegistration()
				.then((reg) => reg?.pushManager.getSubscription())
				.then((sub) => (pushSubscribed = !!sub))
				.catch(() => {});
		}
	});

	function urlBase64ToUint8Array(base64String: string): Uint8Array {
		const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
		const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
		const rawData = atob(base64);
		return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
	}

	async function enablePush() {
		subscribingPush = true;
		showStatus('');
		try {
			if (!pushSupported) {
				throw new Error('Push wird von diesem Browser nicht unterstützt.');
			}
			const permission = await Notification.requestPermission();
			if (permission !== 'granted') {
				throw new Error('Benachrichtigungs-Berechtigung wurde nicht erteilt.');
			}

			const keyRes = await fetch('/api/push/public-key');
			const { publicKey } = await keyRes.json();
			if (!publicKey) {
				throw new Error(
					'Server hat keinen VAPID-Public-Key konfiguriert (siehe .env / README).'
				);
			}

			const reg = await navigator.serviceWorker.register('/service-worker.js');
			await navigator.serviceWorker.ready;
			const sub = await reg.pushManager.subscribe({
				userVisibleOnly: true,
				applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource
			});
			const subJson = sub.toJSON();

			await fetch('/api/push/subscribe', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					endpoint: subJson.endpoint,
					keys: subJson.keys,
					deviceLabel: navigator.userAgent.slice(0, 80)
				})
			});

			pushSubscribed = true;
			notificationEnabled = true;
			showStatus('Push-Benachrichtigungen aktiviert.');
		} catch (e) {
			showStatus(e instanceof Error ? e.message : 'Aktivierung fehlgeschlagen', true);
		} finally {
			subscribingPush = false;
		}
	}

	async function sendTestPush() {
		sendingTestPush = true;
		showStatus('');
		try {
			const res = await fetch('/api/push/test', { method: 'POST' });
			if (!res.ok) throw new Error((await res.json()).message ?? 'Test-Push fehlgeschlagen');
			const result = await res.json();
			showStatus(`Test-Push gesendet an ${result.sent} Gerät(e).`);
		} catch (e) {
			showStatus(e instanceof Error ? e.message : 'Test-Push fehlgeschlagen', true);
		} finally {
			sendingTestPush = false;
		}
	}

	async function runScrapeNow() {
		scraping = true;
		showStatus('');
		try {
			const res = await fetch('/api/jobs/run-scrape', { method: 'POST' });
			const summary = await res.json();
			showStatus(
				summary.success
					? `Scrape abgeschlossen: ${summary.offersIngested} neue Angebote gespeichert.`
					: `Scrape mit Fehlern: ${summary.errors.join('; ')}`,
				!summary.success
			);
			const lastRunRes = await fetch('/api/jobs/last-run');
			lastScrapeRun = await lastRunRes.json();
		} catch (e) {
			showStatus(e instanceof Error ? e.message : 'Scrape fehlgeschlagen', true);
		} finally {
			scraping = false;
		}
	}

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

		<div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border)">
			{#if pushSubscribed}
				<p class="hint">✅ Push-Benachrichtigungen sind auf diesem Gerät aktiviert.</p>
				<button onclick={sendTestPush} disabled={sendingTestPush}>
					{sendingTestPush ? 'Sende…' : 'Test-Push senden'}
				</button>
			{:else}
				<button class="primary" onclick={enablePush} disabled={subscribingPush}>
					{subscribingPush ? 'Aktiviere…' : '🔔 Push-Benachrichtigungen auf diesem Gerät aktivieren'}
				</button>
			{/if}
			<p class="hint" style="margin-top: 0.5rem">
				Auf dem iPhone funktioniert das nur, wenn die App vorher über <em>Teilen → Zum
				Home-Bildschirm</em> zum Home-Bildschirm hinzugefügt und von dort geöffnet wurde (iOS 16.4+),
				und die Seite über HTTPS erreichbar ist.
			</p>
		</div>
	</section>

	<section class="card">
		<h2>Angebots-Abgleich</h2>
		{#if lastScrapeRun}
			<p class="hint">
				Letzter Lauf: {new Date(lastScrapeRun.startedAt).toLocaleString('de-DE')} ·
				{lastScrapeRun.success ? '✅ erfolgreich' : '⚠️ mit Fehlern'} ·
				{lastScrapeRun.offersIngestedCount} neue Angebote
				{#if lastScrapeRun.errorMessage}
					<br /><span style="color: var(--bad)">{lastScrapeRun.errorMessage}</span>
				{/if}
			</p>
		{:else}
			<p class="hint">Noch kein Abgleich gelaufen. Läuft sonst täglich automatisch um 06:00 Uhr.</p>
		{/if}
		<button onclick={runScrapeNow} disabled={scraping}>
			{scraping ? 'Läuft…' : 'Jetzt aktualisieren'}
		</button>
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
