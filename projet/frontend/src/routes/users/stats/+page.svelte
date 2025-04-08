<script>
  import axios from 'axios';
  import { goto } from '$app/navigation';

  let startDate = '';
  let endDate = '';
  let status = '';
  let user = '';
  let stats = [];
  let error = '';
  let currentPage = 1;
  let itemsPerPage = 5;
  let totalItems = 0;

  // Reactive total pages
  $: totalPages = Math.ceil(totalItems / itemsPerPage);
  $: paginatedStats = stats.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Fetch data
  async function handleSubmit() {
    const requestBody = {
      user,
      startDate,
      endDate,
      status
    };

    try {
      const response = await axios.post('http://localhost:8000/api/admin/user/userStats', requestBody);
      stats = response.data || [];
      totalItems = stats.length;
      currentPage = 1; // Reset to page 1 when new data is fetched
      error = '';
    } catch (err) {
      console.error('Axios error:', err);
      error = 'Failed to fetch stats. Please try again.';
    }
  }

  function goToPage(page) {
    if (page >= 1 && page <= totalPages) currentPage = page;
  }

  function getPaginationPages() {
    const pages = [];
    if (totalPages <= 1) return [[1]];

    pages.push(1);

    if (currentPage > 3) {
      pages.push('...');
    }

    const startPage = Math.max(2, currentPage - 1);
    const endPage = Math.min(totalPages - 1, currentPage + 1);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) {
      pages.push('...');
    }

    pages.push(totalPages); // Last page always visible
    return pages;
  }

</script>

<style>
  .container {
    margin: 20px auto;
  
    padding: 20px;
    background: #ffffff;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  }

  h2 {
    text-align: center;
    color: #333;
    margin-bottom: 20px;
  }

  .form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 12px;
    margin-bottom: 20px;
    padding: 20px;
    background: #f9f9f9;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  input[type="datetime-local"],
  input[type="text"] {
    padding: 10px;
    border: 1px solid #ccc;
    border-radius: 6px;
    transition: border-color 0.3s;
  }

  input[type="datetime-local"]:focus,
  input[type="text"]:focus {
    border-color: #007bff;
    outline: none;
  }

  .btn-primary {
    width: 100%;
    padding: 10px;
    background: #007bff;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.3s, transform 0.2s;
  }

  .btn-primary:hover {
    background: #0056b3;
    transform: translateY(-2px);
  }

  .error {
    color: red;
    text-align: center;
    margin-top: 10px;
  }

  .table {
    width: 100%;
    margin-top: 20px;
    border-collapse: collapse;
  }

  .table th, .table td {
    padding: 12px;
    border: 1px solid #ddd;
    text-align: left;
  }

  .table th {
    background: #007bff;
    color: white;
  }

  .table tr:nth-child(even) {
    background: #f2f2f2; /* Alternating row color */
  }

  .pagination {
    display: flex;
    justify-content: center;
    margin-top: 20px;
    list-style: none;
    padding: 0;
  }

  .page-item {
    margin: 0 5px;
  }

  .page-link {
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 6px;
    cursor: pointer;
    background: white;
    transition: background 0.3s;
  }

  .page-item.active .page-link {
    background: #007bff;
    color: white;
  }

  .page-link[disabled] {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .page-link:hover {
    background: #efefef;
  }
</style>
<div class="container">
  <h2>User Stats</h2>

  <!-- Form Section -->
  <div class="form-grid">
    <input type="datetime-local" bind:value={startDate} placeholder="Start Date and Time" step="1" />
    <input type="datetime-local" bind:value={endDate} placeholder="End Date and Time" step="1" />
    <input type="text" bind:value={status} placeholder="Status" />
    <input type="text" bind:value={user} placeholder="User" />
    <button on:click={handleSubmit} class="btn-primary">Submit</button>
  </div>

  <!-- Error Handling -->
  {#if error}
    <p class="error">{error}</p>
  {/if}

  <!-- Table Section -->
  {#if paginatedStats.length > 0}
  <table class="table">
    <thead>
      <tr>
        <th>#ID</th>
        <th>LEAD_ID</th>
        <th>PHONE</th>
        <th>CAMPAIGN</th>
        <th>CALL DATE</th>
        <th>STATUS</th>
        <th>USER</th>
        <th>LIST_ID</th>
        <th>LENGTH</th>
      </tr>
    </thead>
    <tbody>
      {#each paginatedStats as stat, index}
        <tr>
          <td>{index + 1}</td>
          <td>{stat.lead_id}</td>
          <td>{stat.phone_number}</td>
          <td>{stat.campaign_id}</td>
          <td>{new Date(stat.entry_date).toLocaleString()}</td>
          <td>{stat.status}</td>
          <td>{stat.user}</td>
          <td on:click={() => goto(`/liste/fileliste/${stat.list_id}`)}>{stat.list_id}</td>
          <td>{stat.talk_sec}</td>
        </tr>
      {/each}
    </tbody>
  </table>

  <!-- Smart Pagination -->
  <ul class="pagination">
    <li class="page-item">
      <button class="page-link" on:click={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>Prev</button>
    </li>

    {#each getPaginationPages() as page}
      {#if page === '...'}
        <li class="page-item"><span class="page-link">...</span></li>
      {:else}
        <li class="page-item {currentPage === page ? 'active' : ''}">
          <button class="page-link" on:click={() => goToPage(page)}>{page}</button>
        </li>
      {/if}
    {/each}

    <li class="page-item">
      <button class="page-link" on:click={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>Next</button>
    </li>
  </ul>
{:else if !error}
  <p class="text-center">No data found. Please adjust your filters.</p>
{/if}
</div>
