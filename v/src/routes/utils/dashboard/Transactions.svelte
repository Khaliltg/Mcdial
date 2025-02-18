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

