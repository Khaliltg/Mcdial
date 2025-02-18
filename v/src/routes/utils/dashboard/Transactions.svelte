<script lang="ts">
	import LastRange from '../widgets/LastRange.svelte';
	import {
		Button,
		Card,
		Checkbox,
		Dropdown,
		Heading,
		Input,
		Table,
		TableBody,
		TableBodyCell,
		TableBodyRow,
		TableHead,
		TableHeadCell
	} from 'flowbite-svelte';
	import {
		CalendarMonthOutline,
		ChevronDownOutline,
		ChevronRightOutline
	} from 'flowbite-svelte-icons';
	import CreditCard from './CreditCard.svelte';
	import StatusBadge from './StatusBadge.svelte';

	export let dark: boolean = false;

	const headers = [
		'Transaction',
		'Date & Time',
		'Amount',
		'Reference number',
		'Payment method',
		'Status'
	];
	const data: [string, string, string, string, number, CreditCard['state']][] = [
		['Payment from Bonnie Green', 'Apr 23 ,2021', '$2300', '0047568936', 475, 'completed'],
		['Payment refund to #00910', 'Apr 23 ,2021', '-$670', '0078568936', 924, 'completed'],
		['Payment failed from #087651', 'Apr 18 ,2021', '$234', '0088568934', 826, 'cancelled'],
		['Payment from Lana Byrd', 'Apr 15 ,2021', '$5000', '0018568911', 634, 'inprogress'],
		['Payment from Jese Leos', 'Apr 15 ,2021', '$2300', '0045568939', 163, 'completed'],
		['Refund to THEMESBERG LLC', 'Apr 11 ,2021', '-$560', '0031568935', 443, 'inreview'],
		['Payment from Lana Lysle', 'Apr 6 ,2021', '$1437', '0023568934', 223, 'inreview'],
		['Payment to Joseph Mcfall', 'Apr 1 ,2021', '$980', '0057568935', 362, 'completed'],
		['Payment from Alphabet', 'Mar 23 ,2021', '$11,436', '00836143841', 772, 'inprogress'],
		['Payment from Bonnie Green', 'Mar 23 ,2021', '$560', '0031568935', 123, 'completed']
	];
</script>

<Card size="xl" class="shadow-sm max-w-none">
	<div class="items-center justify-between lg:flex">
		<div class="mb-4 mt-px lg:mb-0">
			<Heading tag="h3" class="-ml-0.25 mb-2 text-xl font-semibold dark:text-white">
				Transactions
			</Heading>
			<span class="text-base font-normal text-gray-500 dark:text-gray-400">
				This is a list of latest transactions
			</span>
		</div>
		<div class="items-center justify-between gap-3 space-y-4 sm:flex sm:space-y-0">
			<div class="flex items-center">
				<Button color="alternative" class="w-fit whitespace-nowrap px-4 py-2">
					Filter by status
					<ChevronDownOutline size="lg" />
				</Button>
				<Dropdown class="w-44 space-y-3 p-3 text-sm" placement="bottom-start">
					<li><Checkbox class="accent-primary-600">Completed (56)</Checkbox></li>
					<li><Checkbox checked>Cancelled (56)</Checkbox></li>
					<li><Checkbox class="accent-primary-600">In progress (56)</Checkbox></li>
					<li><Checkbox checked>In review (97)</Checkbox></li>
				</Dropdown>
			</div>
			<div class="flex items-center space-x-4">
				<Input placeholder="From" class="w-full">
					<CalendarMonthOutline slot="left" size="md" />
				</Input>
				<Input placeholder="To" class="w-full">
					<CalendarMonthOutline slot="left" size="md" />
				</Input>
			</div>
		</div>
	</div>

		
		
</Card>
