<script>
    let startDate = '';
    let endDate = '';
    let selectedUserGroup = '';
    let displayFormat = '';
    let orderBy = '';
    let selectedUser = '';

    const userGroups = [
        '-ALL-',
        'ADMIN',
        'seddik',
        'strategie',
        'test',
        'test2',
        'test3'

    ];

    const users = []; // No users in the original image, keep empty for now

    function handleSubmit() {
        console.log('Form submitted with:', {
            startDate,
            endDate,
            selectedUserGroup,
            displayFormat,
            orderBy,
            selectedUser
        });
    }
</script>

<main class="timeclock-report">
    <div class="header">
        <h1>User Timeclock Report </h1>
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
            <h>--- USER TIMECLOCK DETAILS ---</h>
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
                    <tr class="totals-row">
                        <td></td>
                        <td>TOTALS</td>
                        <td></td>
                        <td>0.00</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</main>

<style>
    /* General Styles */
    .timeclock-report {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        max-width: 1000px;
        margin: 20px auto;
        padding: 30px;
        background-color: #f8f9fa; /* Light gray background */
        color: #333;
        border-radius: 12px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }

    /* Header */
    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
    }

    h1 {
        color: #2c3e50;
        font-size: 24px;
        margin: 0;
        padding: 0;
    }

    .help-icon {
        font-size: 18px;
        color: #555;
        cursor: pointer;
    }

    .report-actions {
        text-align: right;
    }

    .download-link,
    .reports-link {
        color: #007bff;
        text-decoration: none;
        font-weight: 500;
    }

    .separator {
        margin: 0 10px;
        color: #ccc;
    }

    /* Filter Section */
    .filter-section {
        background-color: #fff;
        padding: 20px;
        border-radius: 8px;
        margin-bottom: 20px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    .filter-row {
        display: flex;
        flex-wrap: wrap;
        gap: 20px;
        align-items: center;
    }

    .form-group {
        display: flex;
        flex-direction: column;
    }

    label {
        font-size: 14px;
        margin-bottom: 5px;
        color: #555;
    }

    input[type="date"],
    select,
    input[type="text"] {
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 6px;
        font-size: 14px;
        color: #444;
        width: 200px; /* Adjust width as needed */
        box-sizing: border-box;
    }

    input[type="text"]::placeholder {
        color: #999;
    }

    .to-text {
        font-size: 14px;
        margin: 0 10px;
        color: #555;
    }

    /* Button */
    .button-row {
        margin-top: 20px;
        text-align: left;
    }

    button {
        padding: 12px 24px;
        border: none;
        border-radius: 6px;
        background-color: #007bff;
        color: white;
        font-size: 16px;
        cursor: pointer;
        transition: background-color 0.3s ease;
    }

    button:hover {
        background-color: #0056b3;
    }

    /* Report Results */
    .report-results {
        background-color: #fff;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    .report-date {
        font-size: 12px;
        text-align: right;
        color: #777;
    }

    .time-range {
        font-size: 14px;
        font-style: italic;
        margin-bottom: 10px;
        color: #777;
    }

    .report-details h3 {
        font-size: 18px;
        margin-top: 20px;
        margin-bottom: 10px;
    }

    .note {
        font-size: 12px;
        color: #777;
        margin-bottom: 10px;
    }

    /* Table */
    .results-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 10px;
    }

    .results-table th,
    .results-table td {
        padding: 12px;
        border: 1px solid #ddd;
        text-align: left;
        font-size: 14px;
    }

    .results-table th {
        background-color: #f2f2f2;
        font-weight: bold;
    }

    .totals-row {
        font-weight: bold;
        background-color: #f9f9f9;
    }

    /* Media Queries for Responsiveness */
    @media (max-width: 768px) {
        .filter-row {
            flex-direction: column;
            align-items: stretch;
        }

        .form-group {
            width: 100%;
        }

        input[type="date"],
        select,
        input[type="text"] {
            width: 100%;
        }

        .to-text {
            display: none; /* Hide "to" text on small screens */
        }
    }
</style>