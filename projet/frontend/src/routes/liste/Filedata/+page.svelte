<script>
    import { onMount } from 'svelte';
    let availableColumns = [];
    let mapping = {};
  
    onMount(async () => {
      const response = await fetch('http://localhost:/columns');
      const data = await response.json();
      availableColumns = data.columns;
    });
  </script>
  
  <style>
    select { margin: 5px; }
  </style>
  
  <h2>Lead Duplicate Check: NONE</h2>
  <table>
    <tr>
      <th>VICIDIAL Column</th>
      <th>File Data</th>
    </tr>
    {#each [
      'VENDOR LEAD CODE', 'SOURCE ID', 'PHONE CODE', 'PHONE NUMBER', 'FIRST NAME',
      'LAST NAME', 'ADDRESS1', 'CITY', 'POSTAL CODE', 'EMAIL'
    ] as column}
      <tr>
        <td>{column}</td>
        <td>
          <select bind:value={mapping[column]}>
            <option value="none">(none)</option>
            {#each availableColumns as col}
              <option value={col}>{col}</option>
            {/each}
          </select>
        </td>
      </tr>
    {/each}
  </table>
  <button on:click={() => console.log(mapping)}>OK TO PROCESS</button>
  <button on:click={() => mapping = {}}>START OVER</button>
  