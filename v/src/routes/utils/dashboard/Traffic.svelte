<script lang="ts">
	import { Card, Chart } from 'flowbite-svelte';
	import options from '../graphs/traffic';
	import SmallPanel from './SmallPanel.svelte';
	import { DesktopPcOutline, MobilePhoneOutline, TabletOutline } from 'flowbite-svelte-icons';
	import More from '../widgets/More.svelte';

	export let dark: boolean = false;
</script>

