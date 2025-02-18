<script lang="ts">
	import { Breadcrumb, BreadcrumbItem, Button, Checkbox, Drawer, Heading, Input, Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell, Toolbar, ToolbarButton } from 'flowbite-svelte';
	import { CogSolid, DotsVerticalOutline, EditOutline, ExclamationCircleSolid, TrashBinSolid } from 'flowbite-svelte-icons';
	import type { ComponentType } from 'svelte';
	import { sineIn } from 'svelte/easing';
	import Products from '../../../data/product.json';
	import MetaTag from '../../../utils/MetaTag.svelte';
	import Delete from './Delete.svelte';
	import Product from './Product.svelte';

	let hidden: boolean = true; // modal control
	let drawerComponent: ComponentType = Product; // drawer component

	const toggle = (component: ComponentType) => {
		drawerComponent = component;
		hidden = !hidden;
	};

	const path: string = '/crud/products';
  	const description: string = 'CRUD products examaple - Flowbite Svelte Admin Dashboard';
	const title: string = 'Flowbite Svelte Admin Dashboard - CRUD Products';
	const subtitle: string = 'CRUD Products';
	let transitionParams = {
		x: 320,
		duration: 200,
		easing: sineIn
	};
</script>

<MetaTag {path} {description} {title} {subtitle} />


<main class="relative h-full w-full overflow-y-auto bg-white dark:bg-gray-800">
	<div class="p-4">
		<Breadcrumb class="mb-5">
			<BreadcrumbItem home>Home</BreadcrumbItem>
			<BreadcrumbItem href="/crud/products">E-commerce</BreadcrumbItem>
			<BreadcrumbItem>Products</BreadcrumbItem>
		</Breadcrumb>
		<Heading tag="h1" class="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
			All products
		</Heading>

		
	</div></main>