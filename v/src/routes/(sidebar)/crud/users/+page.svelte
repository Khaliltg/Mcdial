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
	import AddUser from './AddUser.svelte';
	let openUser: boolean = false; // modal control
	let openDelete: boolean = false; // modal control

	let current_user: any = {};
	const path: string = '/crud/users';
  const description: string = 'CRUD users examaple - Flowbite Svelte Admin Dashboard';
  const title: string = 'Flowbite Svelte Admin Dashboard - CRUD Users';
  const subtitle: string = 'CRUD Users';

  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { 
      Button as FlowbiteButton, 
      Card, 
      Tabs, 
      TabItem 
  } from 'flowbite-svelte';
  import { 
      UserSolid, 
      PlusOutline as PlusOutlineIcon 
  } from 'flowbite-svelte-icons';

  // Import your user components
  import UserList from './User.svelte';
  import AddUserComponent from './AddUser.svelte';

  // Determine active tab based on URL
  $: activeTab = $page.url.searchParams.get('tab') || 'show';

  function handleTabChange(tab: string) {
      goto(`/crud/users?tab=${tab}`);
  }
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
			Users Management
		</Heading>

		<div class="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
			<div class="container mx-auto">
				<Tabs style="full" defaultClass="flex rounded-lg divide-x divide-gray-200 shadow dark:divide-gray-700">
					<TabItem 
						open={activeTab === 'show'} 
						title="Show Users" 
						on:click={() => handleTabChange('show')}
					>
						<UserList />
					</TabItem>
					<TabItem 
						open={activeTab === 'add'} 
						title="Add New User" 
						on:click={() => handleTabChange('add')}
					>
						<AddUserComponent />
					</TabItem>
				</Tabs>
			</div>
		</div>
	</div>
</main>
