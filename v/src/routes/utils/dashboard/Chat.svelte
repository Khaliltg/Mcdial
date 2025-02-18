<script>
	import { imagesPath } from '../variables';
	import { Card, Textarea, ToolbarButton } from 'flowbite-svelte';
	import {
		ChevronUpOutline,
		DotsVerticalOutline,
		DownloadOutline,
		FileLinesSolid,
		TableColumnOutline
	} from 'flowbite-svelte-icons';
	import Users from '../../data/users.json';
	import ChatMsg from './ChatMsg.svelte';
	import Message from './Message.svelte';
</script>

<Card size="xl">
	<div class="mb-4 flex items-center justify-between">
		<h3 class="text-lg font-semibold text-gray-900 dark:text-white">Smart chat</h3>
		<a
			href="#top"
			class="inline-flex items-center rounded-lg p-2 text-sm font-medium text-primary-700 hover:bg-gray-100 dark:text-primary-500 dark:hover:bg-gray-700"
		>
			View all
		</a>
	</div>
</Card>
