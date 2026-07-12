<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { page } from '$app/state';

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
	<link rel="manifest" href="/manifest.webmanifest" />
</svelte:head>

<nav class="tabs">
	{#each tabs as tab (tab.href)}
		<a href={tab.href} class:active={page.url.pathname === tab.href}>{tab.label}</a>
	{/each}
</nav>

{@render children()}
