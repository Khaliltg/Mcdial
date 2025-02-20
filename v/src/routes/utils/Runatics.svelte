<script lang="ts">
  import { onMount } from 'svelte';
  export let analyticsId:string ='';

  onMount(async () => {
    const script = document.createElement('script');
    script.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag() { dataLayer.push(arguments); }
      gtag('js', new Date());
      gtag('config', '${analyticsId}');
      `;
    document.head.appendChild(script);
  });
</script>

<svelte:head>
  <script async src="https://www.googletagmanager.com/gtag/js?id={analyticsId}"></script>
</svelte:head>
