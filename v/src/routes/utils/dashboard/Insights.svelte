<script lang="ts">
	import { Button, Card, Carousel } from 'flowbite-svelte';
	import {
		ArrowLeftOutline,
		ArrowRightOutline,
		CheckCircleSolid,
		CheckOutline,
		FireSolid,
		LayersSolid,
		RocketSolid
	} from 'flowbite-svelte-icons';
	import { fade, fly } from 'svelte/transition';
	const items = [{}, {}, {}];
	let animation = (node: Element) => fade(node, { duration: 200 });

	let transitionSlideIn = {
		x: '100%',
		opacity: 0.5,
		duration: 500
	};

	let transitionSlideOut = {
		x: '-100%',
		opacity: 0.5,
		duration: 500
	};
</script>

