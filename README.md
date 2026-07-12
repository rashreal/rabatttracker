# RabattTracker

Persönlicher Preisalarm für Supermarkt-Angebote im Stil von SMHaggle: Watchlist mit
Lieblingsprodukten, regionale Angebots-Suche (Marktguru), Preishistorie mit
Preis-Indikator (Top-Preis / Guter Preis / Normal / Teuer), und Push-Benachrichtigungen
als installierbare PWA (Windows-Browser + iPhone "Zum Home-Bildschirm").

Single-User-App, kein Login. Läuft als ein einzelner Docker-Container mit SQLite.

## Bekannte Einschränkungen (bitte lesen)

- **Marktguru-API ist inoffiziell.** Die App liest die Such-API von marktguru.de
  ohne offizielle Dokumentation/Erlaubnis aus (siehe `src/lib/server/offer-providers/marktguru.ts`).
  Die dafür nötigen Auth-Keys sind keine festen Secrets, sondern werden bei jedem
  Bedarf frisch aus einem `<script type="application/json">`-Block auf der
  marktguru.de-Startseite gelesen (Vorbild: das Open-Source-npm-Paket `marktguru`).
  Das kann sich jederzeit ändern oder blockiert werden. In der Sandbox, in der diese
  App entwickelt wurde, war marktguru.de generell nicht erreichbar (HTTP 403 -
  vermutlich Bot-/WAF-Schutz gegen Cloud-/Rechenzentrums-IPs). **Der erste echte
  Test von Produktsuche und Angebots-Abgleich muss von deinem eigenen
  Windows-PC/deiner eigenen Internetverbindung aus erfolgen.**
- **Umkreissuche ist PLZ-basiert, nicht exakt geodätisch.** Die Marktguru-API liefert
  keine Filial-Koordinaten, nur Angebote gefiltert nach der übergebenen PLZ. Der in
  den Einstellungen konfigurierte Radius (km) wird aktuell nicht als exakter
  Kreisradius um deinen Standort durchgesetzt (`distance_km` bleibt `null`) -
  die Regionalität kommt allein aus der PLZ, die du in den Einstellungen hinterlegst.
  Falls sich herausstellt, dass die Live-API zusätzliche Radius-Parameter unterstützt
  (per Browser-Devtools auf marktguru.de prüfbar, sobald du testen kannst), lässt sich
  das in `marktguru.ts` nachrüsten.
- Push-Benachrichtigungen (Permission-Dialog, Service-Worker-Subscribe) konnten aus
  der Sandbox heraus nicht in einem echten Browser getestet werden - nur der
  Server-seitige Teil (Build, Manifest, Service-Worker-Auslieferung, VAPID/Test-Push-
  Endpunkte) wurde verifiziert.

## Lokale Entwicklung

```sh
npm install
cp .env.example .env      # VAPID-Keys optional für reine UI-Entwicklung
npm run dev
```

Öffnet unter `http://localhost:5173`. Die SQLite-Datenbank wird beim ersten Start
automatisch unter `data/rabatttracker.db` angelegt und migriert.

Hinweis: Der Service Worker (für Push) ist im Dev-Modus deaktiviert
(`devOptions.enabled: false` in `vite.config.ts`) - für Push-Tests einen
Produktions-Build verwenden (`npm run build && npm run preview`, oder Docker).

### Push-Benachrichtigungen aktivieren (VAPID-Keys)

```sh
npx web-push generate-vapid-keys
```

Beide Keys plus eine beliebige `mailto:`-Adresse in `.env` eintragen
(`VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`).

## Deployment mit Docker (empfohlen für dauerhaften Betrieb)

Für den Dauerbetrieb auf deinem Windows-PC über Docker Desktop:

```sh
cp .env.example .env
# .env ausfüllen: VAPID-Keys (siehe oben)

docker compose up -d --build
```

Die App läuft danach auf Port 3000, die SQLite-Datei liegt persistent unter
`./data/rabatttracker.db` (Docker-Volume-Mount, übersteht Container-Neustarts/-Updates).

Der tägliche Angebots-Abgleich läuft automatisch per `node-cron` im selben Container
(kein separater Cron-Container nötig) - Uhrzeit ist aktuell fix auf 06:00 Uhr
Serverzeit (`src/hooks.server.ts`).

### HTTPS wird zwingend benötigt

Web Push und Service Worker funktionieren nur über HTTPS (oder `localhost`) - ohne
HTTPS bekommst du auf dem iPhone (und meistens auch am Desktop) **keine**
Push-Benachrichtigungen, egal was in den Einstellungen aktiviert ist. Da die App
dauerhaft auf deinem Windows-PC läuft, brauchst du einen Weg, sie von außen (v.a.
vom iPhone unterwegs) per HTTPS zu erreichen. Zwei einfache Optionen ohne eigenen
Server:

**Option A: Cloudflare Tunnel** (empfohlen, wenn du eine Domain hast oder eine
günstig registrieren willst)
1. Domain zu Cloudflare hinzufügen (falls noch nicht vorhanden).
2. `cloudflared` auf dem Windows-PC installieren, `cloudflared tunnel login`.
3. Tunnel erstellen und auf `http://localhost:3000` zeigen lassen, DNS-Eintrag
   (z.B. `rabatte.deinedomain.de`) im Cloudflare-Dashboard verknüpfen.
4. App ist danach unter `https://rabatte.deinedomain.de` erreichbar - automatisches
   TLS-Zertifikat von Cloudflare.

**Option B: Tailscale Funnel** (kein eigener Domainkauf nötig)
1. Tailscale auf dem Windows-PC installieren und einloggen.
2. `tailscale funnel 3000` ausführen.
3. Tailscale gibt eine `https://<gerätename>.<tailnet>.ts.net`-URL aus, die
   öffentlich (auch vom iPhone ohne Tailscale-App) erreichbar ist.

Beide Optionen laufen dauerhaft im Hintergrund und benötigen keine
Port-Weiterleitung im Router.

## Struktur (Kurzüberblick)

- `src/lib/server/offer-providers/` - austauschbare Datenquelle für Angebote
  (aktuell: Marktguru)
- `src/lib/server/jobs/scrape-offers.ts` - täglicher Abgleich, ruft
  `price-observations.ts` (Speichern/Dedupe) und `alerting.ts` (Push-Entscheidung) auf
- `src/lib/server/price-indicator.ts` - Top-Preis/Guter Preis/Normal/Teuer-Logik
- `src/routes/` - Seiten (`/`, `/watchlist/add`, `/product/[id]`, `/settings`) und
  API-Routen (`/api/...`)
- `src/service-worker.ts` - Push- und Klick-Handling für Benachrichtigungen

## Manueller Abgleich / Fehlersuche

Auf der Einstellungsseite gibt es einen "Jetzt aktualisieren"-Button, der den
Scrape-Job sofort auslöst und den letzten Lauf inkl. Fehlermeldung anzeigt - nützlich,
um die Marktguru-Anbindung nach dem ersten Deploy zu testen, ohne auf 06:00 Uhr zu warten.
