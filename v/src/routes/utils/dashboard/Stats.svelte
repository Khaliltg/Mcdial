<script lang="ts">
	import { Avatar, Card, Heading, Popover, TabItem, Tabs } from 'flowbite-svelte';
	import Change from '../../utils/dashboard/Change.svelte';
	import Customers from '../../data/users.json';
	import { avatarPath, imagesPath } from '../../utils/variables';
	import LastRange from '../widgets/LastRange.svelte';
	import More from '../widgets/More.svelte';
	import { QuestionCircleSolid } from 'flowbite-svelte-icons';

	
	const customers = Customers.slice(0, 5);
</script>

<Card size="xl">
	<div class="mb-4 flex items-center gap-2">
		<Heading tag="h3" class="w-fit text-lg font-semibold dark:text-white">
			Statistics this month
		</Heading>
		<button>
			<span class="sr-only">Show information</span>
			<QuestionCircleSolid size="sm" class="text-gray-400 hover:text-gray-500" />
		</button>
		<Popover placement="bottom-start">
			<div class="w-72 space-y-2 text-sm font-normal text-gray-500 dark:text-gray-400">
				<h3 class="font-semibold text-gray-900 dark:text-white">Statistics</h3>
				<p>
					Statistics is a branch of applied mathematics that involves the collection, description,
					analysis, and inference of conclusions from quantitative data.
				</p>
				<More title="Read more" href="#top" flat />
			</div>
		</Popover>
	</div>
	<Tabs
		style="full"
		defaultClass="flex divide-x rtl:divide-x-reverse divide-gray-200 shadow dark:divide-gray-700"
		contentClass="p-3 mt-4"
	>
		<TabItem class="w-full" open>
			<span slot="title">Top products</span>
			<ul class="-m-3 divide-y divide-gray-200 dark:divide-gray-700 dark:bg-gray-800">
			
			</ul>
		</TabItem>

	</Tabs>

	<div
		class="mt-4 flex items-center justify-between border-t border-gray-200 pt-3 dark:border-gray-700 sm:pt-6"
	>
		<LastRange />
		<More title="Full Report" href="#top" />
	</div>
</Card>
