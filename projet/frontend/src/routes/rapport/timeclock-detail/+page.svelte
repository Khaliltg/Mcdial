<script>
    import { fetchWithAuth } from '$lib/utils/fetchWithAuth.js';
    import { onMount } from 'svelte';
    let startDate = '';
    let endDate = '';
    let selectedUserGroup = '';
    let displayFormat = 'TEXT';
    let orderBy = 'hours_down';
    let selectedUser = '';
    

    const userGroups = ['-ALL-', 'ADMIN', 'seddik', 'strategie', 'test', 'test2', 'test3'];
    const users = []; // à remplir si besoin
    let results = [];
    let timeclockData=[]
    let totalHours = 0;
    let errorMessage=""
    async function handleSubmit() {
  try {
    const response = await fetchWithAuth(`http://localhost:8000/api/timeclock/get`);
    
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({})); // en cas de réponse vide
      console.error('Erreur API:', errorBody?.error || response.statusText);
      errorMessage = errorBody?.error || `Erreur ${response.status}`;
      return;
    }

    const data = await response.json();
    timeclockData = data.data || []; // ou autre nom de propriété
    errorMessage = '';
  } catch (error) {
    console.error('Erreur lors de la récupération des données:',error);
   
  }
}

</script>

<main class="timeclock-report">
    <div class="header">
        <h1>User Timeclock Report</h1>
        <div class="report-actions">
            <a href="#" class="download-link">DOWNLOAD</a>
            <span class="separator">|</span>
            <a href="#" class="reports-link">REPORTS</a>
        </div>
    </div>

    <div class="filter-section">
        <div class="filter-row">
            <div class="form-group">
                <label for="start-date">Date Range:</label>
                <input type="date" id="start-date" bind:value={startDate} />
                <span class="to-text">to</span>
                <input type="date" id="end-date" bind:value={endDate} />
            </div>

            <div class="form-group">
                <label for="user-group">User Groups:</label>
                <select id="user-group" bind:value={selectedUserGroup}>
                    {#each userGroups as group}
                        <option value={group}>{group}</option>
                    {/each}
                </select>
            </div>

            <div class="form-group">
                <label for="display-format">Display as:</label>
                <select id="display-format" bind:value={displayFormat}>
                    <option value="TEXT">TEXT</option>
                    <option value="HTML">HTML</option>
                </select>
            </div>

            <div class="form-group">
                <label for="order-by">Order:</label>
                <select id="order-by" bind:value={orderBy}>
                    <option value="hours_down">Hours (Descending)</option>
                    <option value="name">Name</option>
                    <option value="group">Group</option>
                </select>
            </div>

            <div class="form-group">
                <label for="user-select">User:</label>
                <input type="text" id="user-select" bind:value={selectedUser} placeholder="Enter User" />
            </div>
        </div>

        <div class="button-row">
            <button class="submit-btn" on:click={handleSubmit}>SUBMIT</button>
        </div>
    </div>

    <div class="report-results">
        <h2>User Timeclock Report</h2>
        <p class="report-date">{new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</p>
        <p class="time-range">Time range: {startDate} to {endDate}</p>

        <div class="report-details">
            <h3>--- USER TIMECLOCK DETAILS ---</h3>
            <p class="note">These totals do NOT include any active sessions</p>

            <table class="results-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>USER NAME</th>
                        <th>GROUP</th>
                        <th>HOURS</th>
                    </tr>
                </thead>
                <tbody>
                    {#each results as row, i}
                        <tr>
                            <td>{i + 1}</td>
                            <td>{row.full_name} ({row.user})</td>
                            <td>{row.user_group}</td>
                            <td>{row.total_hours}</td>
                        </tr>
                    {/each}
                    <tr class="totals-row">
                        <td></td>
                        <td>TOTALS</td>
                        <td></td>
                        <td>{totalHours}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</main>

<style>
    /* Ton style CSS déjà bien défini reste inchangé ici */
</style>
