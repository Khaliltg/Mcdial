<script lang="ts">
  import thickbars from '../graphs/thickbars';
  import ChartWidget from '../widgets/ChartWidget.svelte';
  import { Card, Chart } from 'flowbite-svelte';
  import type { PageData } from '../../(sidebar)/$types';
  import Stats from './Stats.svelte';
  import users from '../graphs/users';
  import DarkChart from '../widgets/DarkChart.svelte';
  import { onMount } from 'svelte';
  import getChartOptions from '../../(sidebar)/dashboard/chart_options';
  import ActivityList from './ActivityList.svelte';
  import Change from './Change.svelte';
  import DesktopPc from './DesktopPc.svelte';
  import Insights from './Insights.svelte';
  import Traffic from './Traffic.svelte';
  import Transactions from './Transactions.svelte';

  export let data: PageData;

  let chartOptions = getChartOptions(false);
  chartOptions.series = data.series;

  let dark = false;

  function handler(ev: Event) {
    if ('detail' in ev && typeof ev.detail === 'boolean') {
      chartOptions = getChartOptions(ev.detail);
      chartOptions.series = data.series;
      dark = !!ev.detail;
    }
  }

  onMount(() => {
    document.addEventListener('dark', handler);
    return () => document.removeEventListener('dark', handler);
  });
</script>


  <div class="grid grid-cols-1 gap-4 xl:grid-cols-2">
    <div class="flex flex-col gap-4">
      <DesktopPc />
      <Traffic {dark} />
    </div>
  </div>
  <div class="grid grid-cols-1 gap-4 xl:grid-cols-2">
    <ActivityList />
    <Insights />
  </div>

  <Transactions {dark} />
