<script lang="ts">
	import {
		Avatar,
		Breadcrumb,
		BreadcrumbItem,
		Button,
		Checkbox,
		Heading,
		Indicator
	} from 'flowbite-svelte';
	import { Input, Table, TableBody, TableBodyCell, TableBodyRow, TableHead } from 'flowbite-svelte';
	import { TableHeadCell, Toolbar, ToolbarButton, ToolbarGroup } from 'flowbite-svelte';
	import { CogSolid, DotsVerticalOutline, DownloadSolid } from 'flowbite-svelte-icons';
	import {
		EditOutline,
		ExclamationCircleSolid,
		PlusOutline,
		TrashBinSolid
	} from 'flowbite-svelte-icons';
	import Users from '../../../data/users.json';
	import { imagesPath } from '../../../utils/variables';

	import User from './User.svelte';
	import Delete from './Delete.svelte';
	import MetaTag from '../../../utils/MetaTag.svelte';

	let openUser: boolean = false; // modal control
	let openDelete: boolean = false; // modal control

	let current_user: any = {};
	const path: string = '/crud/users';
  const description: string = 'CRUD users examaple - Flowbite Svelte Admin Dashboard';
  const title: string = 'Flowbite Svelte Admin Dashboard - CRUD Users';
  const subtitle: string = 'CRUD Users';
</script>

<MetaTag {path} {description} {title} {subtitle} />

<main class="relative h-full w-full overflow-y-auto bg-white dark:bg-gray-800">
	<div class="p-4">
		<Breadcrumb class="mb-5">
			<BreadcrumbItem home>Home</BreadcrumbItem>
			<BreadcrumbItem href="/crud/users">Users</BreadcrumbItem>
			<BreadcrumbItem>List</BreadcrumbItem>
		</Breadcrumb>
		<Heading tag="h1" class="text-xl font-semibold text-gray-900 dark:text-white sm:text-2xl">
			All users
		</Heading>

		
</main>

<!-- Modals -->

<User bind:open={openUser} data={current_user} />
<Delete bind:open={openDelete} />
