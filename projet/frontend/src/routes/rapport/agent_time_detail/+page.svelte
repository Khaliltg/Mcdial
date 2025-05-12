<script>
    let startDate = '';
    let endDate = '';
    let selectedCampaign = '';
    let selectedUserGroup = '';
    let shiftOption = '';
    let displayAs = '';
    let showParkHolds = false;
    let timeInSeconds = false;
    let searchArchivedData = false;
    let loading = false;
    let submissionResult = '';
    let reportData = [];

    const campaigns = ['-ALL CAMPAIGNS-', 'B2C', 'CANADA1'];
    const userGroups = ['-ALL USER GROUPS-', 'ALL', 'ADMIN', 'seddk', 'strategic'];

    async function handleSubmit() {
        submissionResult = '';
        reportData = [];

        // Validation front-end
        if (!startDate || !endDate) {
            submissionResult = 'Veuillez sélectionner une date de début et une date de fin.';
            return;
        }

        loading = true;
        try {
            const response = await fetch('http://localhost:8000/api/agent-time/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    startDate,
                    endDate,
                    selectedCampaign,
                    selectedUserGroup,
                    shiftOption,
                    displayAs,
                    showParkHolds,
                    timeInSeconds,
                    searchArchivedData
                })
            });

            const payload = await response.json();
            if (!response.ok) {
                submissionResult = payload.message || 'Erreur du serveur';
            } else {
                submissionResult = 'Form submitted successfully!';
                // Adapter selon la structure renvoyée par le backend
                reportData = payload.reportData || payload;
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            submissionResult = 'Une erreur est survenue.';
        } finally {
            loading = false;
        }
    }

    // Convertit des secondes en HH:MM:SS
    function formatSeconds(sec) {
        const s = Number(sec) || 0;
        const hrs = Math.floor(s / 3600);
        const mins = Math.floor((s % 3600) / 60);
        const secs = s % 60;
        return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
</script>

<main class="agent-time-report">
    <h1>Agent Time Detail</h1>

    <div class="instructions">
        <p>Please select a campaign or user group and date-time below and click submit.</p>
        <p class="note">Note: Stats are taken from the specified shift.</p>
    </div>

    <div class="filter-form">
        <table class="filter-table">
            <thead>
                <tr>
                    <th>Dates</th>
                    <th>Campaigns</th>
                    <th>User Groups</th>
                    <th>Shift</th>
                    <th>Display as</th>
                    <th colspan="3">Actions</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>
                        <label for="start-date">Start Date:</label>
                        <input type="date" id="start-date" bind:value={startDate} />
                    </td>
                    <td>
                        <label for="campaign">Campaign:</label>
                        <select id="campaign" bind:value={selectedCampaign}>
                            {#each campaigns as campaign}
                                <option value={campaign}>{campaign}</option>
                            {/each}
                        </select>
                    </td>
                    <td>
                        <label for="user-group">User Group:</label>
                        <select id="user-group" bind:value={selectedUserGroup}>
                            {#each userGroups as group}
                                <option value={group}>{group}</option>
                            {/each}
                        </select>
                    </td>
                    <td>
                        <label for="shift">Shift:</label>
                        <select id="shift" bind:value={shiftOption}>
                            <option value="ALL">All</option>
                            <option value="Morning">Morning</option>
                            <option value="Afternoon">Afternoon</option>
                            <option value="Evening">Evening</option>
                        </select>
                    </td>
                    <td>
                        <label for="display">Display As:</label>
                        <select id="display" bind:value={displayAs}>
                            <option value="TEXT">Text</option>
                            <option value="CHART">Chart</option>
                            <option value="TABLE">Table</option>
                        </select>
                    </td>
                   
                   
                    <td>
                        <button class="submit-btn" on:click={handleSubmit} disabled={loading}>
                            {#if loading}Loading...{:else}Submit{/if}
                        </button>
                    </td>
                </tr>
                <tr>
                    <td class="to-cell">to</td>
                    <td>{selectedCampaign === '-ALL CAMPAIGNS-' ? '' : selectedCampaign}</td>
                    <td>{selectedUserGroup === '-ALL USER GROUPS-' ? '' : selectedUserGroup}</td>
                    <td>
                        <label>
                            <input type="checkbox" bind:checked={showParkHolds} id="park-holds" />
                            <span>Show Park Holds</span>
                        </label>
                        <label>
                            <input type="checkbox" bind:checked={timeInSeconds} id="time-seconds" />
                            <span>Time in Seconds</span>
                        </label>
                        <label>
                            <input type="checkbox" bind:checked={searchArchivedData} id="archived-data" />
                            <span>Search Archived Data</span>
                        </label>
                    </td>
                    <td colspan="2"></td>
                </tr>
                <tr>
                    <td>
                        <label for="end-date">End Date:</label>
                        <input type="date" id="end-date" bind:value={endDate} />
                    </td>
                    <td colspan="5"></td>
                </tr>
            </tbody>
        </table>
    </div>

    {#if submissionResult}
        <div class="submission-result">{submissionResult}</div>
    {/if}

    <div class="results-section">
        {#if loading}
            <p>Loading data...</p>
        {:else if reportData.length === 0}
            <p>Aucune donnée disponible pour les critères sélectionnés.</p>
        {:else}
            <table class="filter-table">
                <thead>
                    <tr>
                        <th>User Name</th>
                        <th>Calls</th>
                        <th>Login Time</th>
                        <th>Wait</th>
                        <th>Talk</th>
                        <th>Dispo</th>
                        <th>Pause</th>
                        <th>Dead</th>
                    </tr>
                </thead>
                <tbody>
                    {#each reportData as agent}
                        <tr>
                            <td>{agent.username}</td>
                            <td>{agent.calls || 0}</td>
                            <td>{agent.loginTime || '0'}</td>
                            <td>{formatSeconds(agent.waitTime) || '0'}</td>
                            <td>{formatSeconds(agent.talkTime) || '0'}</td>
                            <td>{formatSeconds(agent.dispoTime) || '0'}</td>
                            <td>{formatSeconds(agent.pauseTime) || '0'}</td>
                            <td>{formatSeconds(agent.deadTime) || '0'}</td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        {/if}
    </div>
</main>

<style>
    /* General Styles */
    body {
        background-color: #f4f6f8;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        line-height: 1.6;
        color: #333;
        margin: 0;
        padding: 0;
    }

    .agent-time-report {
        max-width: 1200px;
        padding: 2rem;
        border-radius: 12px;
        background-color: #fff;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }

    h1 {
        color: #2d3748;
        font-size: 2.5rem;
        margin-bottom: 1.5rem;
        text-align: center;
    }

    .instructions {
        margin-bottom: 1.5rem;
        text-align: center;
        color: #555;
    }

    .note {
        font-style: italic;
        color: #718096;
    }

    .filter-table {
        width: 100%;
        border-collapse: collapse;
        border-spacing: 0;
    }

    .filter-table th,
    .filter-table td {
        padding: 1rem;
        border: 1px solid #e2e8f0;
        text-align: left;
        vertical-align: middle;
    }

    .filter-table th {
        background-color: #edf2f7;
        font-weight: 600;
        color: #4a5568;
        text-transform: uppercase;
        font-size: 0.85rem;
    }

    .to-cell {
        text-align: center;
        font-weight: bold;
        color: #4a5568;
    }

    label {
        display: block;
        margin-bottom: 0.3rem;
        color: #4a5568;
        font-size: 0.9rem;
    }

    input[type="date"],
    select {
        padding: 0.75rem;
        width: 100%;
        box-sizing: border-box;
        border: 1px solid #cbd5e0;
        border-radius: 0.375rem;
        margin-top: 0.25rem;
        transition: border-color 0.2s ease-in-out;
        font-size: 1rem;
        background-color: #fff;
    }

    input[type="date"]:focus,
    select:focus {
        border-color: #63b3ed;
        outline: none;
        box-shadow: 0 0 0 2px rgba(99, 179, 237, 0.2);
    }

    button {
        padding: 0.75rem 1.25rem;
        cursor: pointer;
        border: none;
        border-radius: 0.375rem;
        font-weight: 600;
        transition: background-color 0.2s ease-in-out, transform 0.1s ease;
        font-size: 1rem;
        white-space: nowrap;
    }

    .submit-btn {
        background-color: #48bb78;
        color: white;
    }

    .download-btn {
        background-color: #4299e1;
        color: white;
    }

    .reports-btn {
        background-color: #ed8936;
        color: white;
    }

    button:hover {
        filter: brightness(0.9);
        transform: translateY(-1px);
    }

    button:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }

    .submission-result {
        margin-top: 1rem;
        padding: 1rem;
        border-radius: 0.375rem;
        background-color: rgba(72, 187, 120, 0.2);
        color: #48bb78;
        text-align: center;
    }

    .results-section {
        margin-top: 2rem;
        border: 1px solid #e2e8f0;
        padding: 1.5rem;
        min-height: 200px;
        background-color: #f9fafb;
        border-radius: 0.375rem;
    }

    @media (max-width: 768px) {
        .filter-table {
            display: block;
            overflow-x: auto;
        }

        button {
            width: 100%;
            margin-bottom: 0.75rem;
        }
    }
</style>
