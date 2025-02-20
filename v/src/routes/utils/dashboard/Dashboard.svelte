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
  
  <div class="min-h-screen bg-gray-50 p-8 dark:bg-gray-900">
    <h1 class="text-3xl font-bold text-gray-800 dark:text-white mb-2">Dashboard</h1>
    <h2 class="text-xl text-gray-500 dark:text-gray-400 mb-6">Overview of Latest Month</h2>
  
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card class="h-full">
        <p class="text-gray-500 dark:text-gray-400">Current Month Sales</p>
        <p class="text-4xl font-bold text-blue-600 dark:text-blue-500"></p>
      </Card>
  
      <Card class="h-full">
        <h3 class="font-bold text-gray-700 dark:text-gray-300 mb-4">Last Month Summary</h3>
        <div class="space-y-3">
          <div>
            <p class="text-gray-500 dark:text-gray-400">Lost Month</p>
            <p class="font-bold text-gray-800 dark:text-white"></p>
          </div>
          <div>
            <p class="text-gray-500 dark:text-gray-400">Retired Earning</p>
            <p class="font-bold text-gray-800 dark:text-white"></p>
          </div>
        </div>
      </Card>
  
      <Card class="h-full">
        <div class="space-y-4">
          <div>
            <p class="text-gray-500 dark:text-gray-400">Estimate Sales</p>
            <p class="font-bold text-gray-800 dark:text-white"></p>
          </div>
          <div>
            <p class="text-gray-500 dark:text-gray-400">Earning</p>
            <p class="font-bold text-green-600 dark:text-green-500"></p>
          </div>
        </div>
      </Card>
    </div>
  
    
    <div class="grid grid-cols-1 gap-4 xl:grid-cols-2 mb-8">
      <Card>
        <h3 class="font-bold text-gray-700 dark:text-white mb-6">Traffic</h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p class="text-gray-500 dark:text-gray-400">Revenue Status</p>
            <p class="font-bold text-gray-800 dark:text-white"> <span class="text-sm font-normal">Jan 01 - Jan 10</span></p>
          </div>
          <div>
            <p class="text-gray-500 dark:text-gray-400">Page View</p>
            <p class="font-bold text-gray-800 dark:text-white"></p>
          </div>
          <div>
            <p class="text-gray-500 dark:text-gray-400">Bounce Rate</p>
            <p class="font-bold text-gray-800 dark:text-white"> <span class="text-sm font-normal">Monthly</span></p>
          </div>
          <div>
            <p class="text-gray-500 dark:text-gray-400">Revenue Status</p>
            <p class="font-bold text-gray-800 dark:text-white"> <span class="text-sm font-normal">Jan 01 - Jan 10</span></p>
          </div>
        </div>
      </Card>
    </div>
  
    <div class="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <div class="flex flex-col gap-4">
        <DesktopPc />
        <Traffic {dark} />
      </div>
    </div>
    
    <div class="grid grid-cols-1 gap-4 xl:grid-cols-2 mt-8">
      <ActivityList />
      <Insights />
    </div>
  
  </div>
