<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';
	import { base } from '$app/paths';

	let { children } = $props();

	const tabs = [
		{ href: '/', label: 'Übersicht' },
		{ href: '/watchlist/add', label: 'Produkt hinzufügen' },
		{ href: '/settings', label: 'Einstellungen' }
	];
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta name="theme-color" content="#2563eb" />
	<link rel="manifest" href="{base}/manifest.webmanifest" />
	<link rel="apple-touch-icon" href="{base}/icons/apple-touch-icon.png" />
	<meta name="apple-mobile-web-app-capable" content="yes" />
	<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
	<meta name="apple-mobile-web-app-title" content="RabattTracker" />
</svelte:head>

<nav class="tabs">
	{#each tabs as tab (tab.href)}
		<a href="{base}{tab.href}" class:active={page.url.pathname === base + tab.href}>{tab.label}</a>
	{/each}
</nav>

{@render children()}
