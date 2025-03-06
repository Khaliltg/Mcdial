<script>
    import { onMount } from "svelte";

    /**
   * @type {{ campaign_id: any; campaign_name: any; active: string; user_group: any; dial_method: any; auto_dial_level: any; script: any; } | null}
   */
    let company = null;
    /**
   * @type {null}
   */
    let user = null;
    let loading = true;
    /**
   * @type {null}
   */
    let error = null;
    let id;

    // Fetching the user associated with the campaign
    /**
   * @param {any} campaign_id
   */
    async function fetchUserDetails(campaign_id) {
        try {
            const response = await fetch(`http://localhost:8000/api/admin/compagnies/getCampaignAgents/${campaign_id}`);
            if (!response.ok) {
                throw new Error(`Erreur ${response.status}: Impossible de récupérer les détails de l'utilisateur.`);
            }
            user = await response.json();  // Assuming the response returns user data based on campaign_id
            console.log(user);
        } catch (err) {
            // @ts-ignore
            error = err.message;
        }
    }

    onMount(async () => {
        id = window.location.pathname.split("/").pop(); // Retrieve the last segment of the URL

        try {
            const response = await fetch(`http://localhost:8000/api/admin/compagnies/getById/${id}`);
            if (!response.ok) {
                throw new Error(`Erreur ${response.status}: Impossible de récupérer les détails de la compagnie.`);
            }
            company = await response.json();  // Fetch campaign data
            console.log(company);

            // Once campaign data is retrieved, fetch the user associated with the campaign
            if (company && company.campaign_id) {
                await fetchUserDetails(company.campaign_id);  // Fetch user details using campaign_id
            }
        } catch (err) {
            // @ts-ignore
            error = err.message;
        } finally {
            loading = false;
        }
    });

    // Pagination state
    let currentPage = 1;
    let itemsPerPage = 5; // Number of items to display per page

    // Pagination logic
    $: totalPages = Math.ceil((user ? user.length : 0) / itemsPerPage);
    $: displayedUsers = user ? user.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage) : [];

    function goToPage(page) {
        currentPage = page;
    }
</script>

<style>
    .card {
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        transition: transform 0.2s;
    }
    .card:hover {
        transform: scale(1.02);
    }
    .card-header {
        background-color: #007bff;
        color: white;
        padding: 1rem;
    }
    .btn {
        background-color: #28a745;
        color: white;
        padding: 0.5rem 1rem;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        transition: background-color 0.3s;
    }
    .btn:hover {
        background-color: #218838;
    }
    .table {
        border-collapse: collapse;
        width: 100%;
    }
    .table th, .table td {
        border: 1px solid #ddd;
        padding: 8px;
        text-align: left;
    }
    .table th {
        background-color: #f0f0f0;
    }
    .pagination {
        display: flex;
        justify-content: center;
        align-items: center;
        margin-top: 1rem;
    }
    .pagination .page-item.active .page-link {
        background-color: #007bff;
        color: white;
    }
    .pagination .page-link {
        border-radius: 0.5rem;
        margin: 0 0.25rem;
    }
    .pagination .page-link:hover {
        background-color: #0056b3;
        color: white;
    }
</style>

<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.2/font/bootstrap-icons.css">

{#if loading}
    <div class="text-center mt-5">
        <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Chargement...</span>
        </div>
    </div>
{:else if error}
    <div class="text-center mt-5">
        <h2 class="text-danger">Erreur : {error}</h2>
    </div>
{:else}
    <div class="container mt-4">
        <h3>Informations de la Campagne:</h3>
        <div class="row mb-3">
            <div class="col">
                <p><strong>Campaign ID:</strong> {company?.campaign_id || "N/A"}</p>
                <p><strong>Campaign Name:</strong> {company?.campaign_name || "N/A"}</p>
                <p><strong>Status:</strong> {company?.active === 'Y' ? 'Active' : 'Inactive'}</p>
                <p><strong>Admin User Group:</strong> {company?.user_group || "---ALL---"}</p>
                <p><strong>Dial Method:</strong> {company?.dial_method || "MANUAL"}</p>
                <p><strong>Dial Level:</strong> {company?.auto_dial_level || "0"}</p>
                <p><strong>Script:</strong> {company?.script || "N/A"}</p>
            </div>
        </div>

        {#if user}
            <h3 class="mt-4">Utilisateur de la campagne:</h3>
            <div class="mb-3">
                <label for="itemsPerPage" class="form-label">Items per Page:</label>
                <select id="itemsPerPage" class="form-select" bind:value={itemsPerPage} on:change={() => goToPage(1)}>
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="20">20</option>
                </select>
            </div>
            <table class="table table-striped table-bordered">
                <thead>
                    <tr>
                        <th scope="col">#</th>
                        <th scope="col">Nom de l'utilisateur</th>
                        <th scope="col">Rank</th>
                        <th scope="col">Grade</th>
                        <th scope="col">Calls today</th>
                    </tr>
                </thead>
                <tbody>
                    {#each displayedUsers as userItem, index}
                        <tr>
                            <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                            <td>{userItem.user }</td>
                            <td>{userItem.campaign_rank }</td>
                            <td>{userItem.campaign_grade }</td>    
                            <td>{userItem.hopper_calls_today }</td>
                        </tr>
                    {/each}
                </tbody>
            </table>
            <nav aria-label="Page navigation">
                <ul class="pagination justify-content-center">
                    <li class="page-item" class:disabled={currentPage === 1}>
                        <button class="page-link" on:click={() => goToPage(1)} title="First Page"><i class="bi bi-chevron-double-left"></i> First</button>
                    </li>
                    <li class="page-item" class:disabled={currentPage === 1}>
                        <button class="page-link" on:click={() => goToPage(currentPage - 1)} title="Previous Page"><i class="bi bi-chevron-left"></i> Previous</button>
                    </li>
                    {#each Array(totalPages) as _, index}
                        <li class="page-item" class:active={currentPage === index + 1}>
                            <button class="page-link" on:click={() => goToPage(index + 1)}>{index + 1}</button>
                        </li>
                    {/each}
                    <li class="page-item" class:disabled={currentPage === totalPages}>
                        <button class="page-link" on:click={() => goToPage(currentPage + 1)} title="Next Page"><i class="bi bi-chevron-right"></i> Next</button>
                    </li>
                    <li class="page-item" class:disabled={currentPage === totalPages}>
                        <button class="page-link" on:click={() => goToPage(totalPages)} title="Last Page"><i class="bi bi-chevron-double-right"></i> Last</button>
                    </li>
                </ul>
            </nav>
        {/if}
       
    </div>
{/if}
