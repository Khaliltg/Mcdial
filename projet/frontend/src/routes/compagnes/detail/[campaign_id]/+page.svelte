<script>
    import { onMount } from "svelte";
    import { Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell } from 'flowbite-svelte';
    import CampaignDetail from '../VueDetails.svelte'; // Import the new component

    let company = null;
    let users = [];
    let lists = [];
    let loading = true;
    let error = null;
    let id;
    let showAllUsers = false;
    let activeView = 'basic'; // Track the active view

    async function fetchUserDetails(campaign_id) {
        try {
            const response = await fetch(`http://localhost:8000/api/admin/compagnies/getCampaignAgents/${campaign_id}`);
            if (!response.ok) {
                users = [];
                return;
            }
            users = await response.json();
        } catch (err) {
            error = err.message;
        }
    }

    async function fetchCampaignLists(campaign_id) {
        try {
            const response = await fetch(`http://localhost:8000/api/admin/compagnies/getCampaignLists/${campaign_id}`);
            if (!response.ok) {
                lists = [];
                return;
            }
            lists = await response.json();
        } catch (err) {
            error = err.message;
        }
    }

    function formatDate(dateString) {
        const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false };
        return new Date(dateString).toLocaleString('fr-FR', options);
    }

    onMount(async () => {
        id = window.location.pathname.split("/").pop();

        try {
            const response = await fetch(`http://localhost:8000/api/admin/compagnies/getById/${id}`);
            if (!response.ok) {
                throw new Error(`Erreur ${response.status}: Impossible de récupérer les détails de la compagnie.`);
            }
            company = await response.json();

            if (company && company.campaign_id) {
                await fetchUserDetails(company.campaign_id);
                await fetchCampaignLists(company.campaign_id);
            }
        } catch (err) {
            error = err.message;
        } finally {
            loading = false;
        }
        
    });

    let currentPage = 1;
    let itemsPerPage = 5;

    $: displayedUsers = showAllUsers ? users : users.slice(0, itemsPerPage);

    function toggleShowAll() {
        showAllUsers = !showAllUsers;
    }

    function setActiveView(view) {
        activeView = view; 
    }

</script>

<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.2/font/bootstrap-icons.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flowbite@1.5.0/dist/flowbite.min.css">

<!-- Navbar -->
<nav class="navbar navbar-expand-lg navbar-light bg-light mb-4">
    <div class="container-fluid">
        <a class="navbar-brand" href="#">Gestion de Campagne</a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
            <ul class="navbar-nav">
                <li class="nav-item">
                    <a class="nav-link {activeView === 'basic' ? 'active' : ''}" href="#" on:click={() => setActiveView('basic')}>Vue de Base</a>
                </li>
           
                <li class="nav-item">
                    <a class="nav-link {activeView === 'list' ? 'active' : ''}" href="#" on:click={() => setActiveView('list')}>Mélange de Listes</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link {activeView === 'real-time' ? 'active' : ''}" href="#" on:click={() => setActiveView('real-time')}>Écran en Temps Réel</a>
                </li>
            </ul>
        </div>
    </div>
</nav>

{#if loading}
    <div class="text-center mt-5">
        <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Chargement...</span>
        </div>
    </div>
{:else if error}
    <div class="text-center mt-5">
        <div class="alert alert-danger" role="alert">
            Erreur : {error}
        </div>
    </div>
{:else}
    {#if activeView === 'basic'}
        <div class="container mt-4">
            <h3 class="mb-4">Informations de la Campagne :</h3>
            <CampaignDetail {company} />
            
            <h3 class="mt-4">Utilisateurs de la Campagne :</h3>
            <div class="mb-3">
                <label for="itemsPerPage" class="form-label">Éléments par Page :</label>
                <select id="itemsPerPage" class="form-select" bind:value={itemsPerPage} on:change={() => toggleShowAll(false)}>
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="40">40</option>
                </select>
            </div>
            
            <Table class="table table-striped table-hover">
                <TableHead>
                    <TableHeadCell>#</TableHeadCell>
                    <TableHeadCell>Nom de l'Utilisateur</TableHeadCell>
                    <TableHeadCell>Grade</TableHeadCell>
                    <TableHeadCell>Rang</TableHeadCell>
                    <TableHeadCell>Appels Aujourd'hui</TableHeadCell>
                </TableHead>
                <TableBody>
                    {#if users.length > 0}
                        {#each displayedUsers as userItem, index}
                            <TableBodyRow>
                                <TableBodyCell>{(currentPage - 1) * itemsPerPage + index + 1}</TableBodyCell>
                                <TableBodyCell>{userItem.user}</TableBodyCell>
                                <TableBodyCell>{userItem.campaign_grade}</TableBodyCell>
                                <TableBodyCell>{userItem.campaign_rank}</TableBodyCell>
                                <TableBodyCell>{userItem.hopper_calls_today}</TableBodyCell>
                            </TableBodyRow>
                        {/each}
                    {:else}
                        <TableBodyRow>
                            <TableBodyCell colspan="5" class="text-center">Aucun utilisateur n'est associé à cette campagne.</TableBodyCell>
                        </TableBodyRow>
                    {/if}
                </TableBody>
            </Table>

            {#if !showAllUsers && users.length > itemsPerPage}
                <div class="text-center mt-3">
                    <button class="btn btn-primary" on:click={toggleShowAll}>
                        Voir plus
                    </button>
                </div>
            {/if}

            <h3 class="mt-4">Listes de la Campagne :</h3>
            <Table class="table table-striped table-hover">
                <TableHead>
                    <TableHeadCell>#</TableHeadCell>
                    <TableHeadCell>Nom de la Liste</TableHeadCell>
                    <TableHeadCell>Description</TableHeadCell>
                    <TableHeadCell>Heure d'Appel Local</TableHeadCell>
                    <TableHeadCell>Tally</TableHeadCell>
                    <TableHeadCell>Statut</TableHeadCell>
                    <TableHeadCell>Date du Dernier Appel</TableHeadCell>
                </TableHead>
                <TableBody>
                    {#if lists.length > 0}
                        {#each lists as listItem, index}
                            <TableBodyRow>
                                <TableBodyCell>{index + 1}</TableBodyCell>
                                <TableBodyCell>{listItem.list_name}</TableBodyCell>
                                <TableBodyCell>{listItem.list_description}</TableBodyCell>
                                <TableBodyCell>{listItem.local_call_time}</TableBodyCell>
                                <TableBodyCell>{listItem.tally}</TableBodyCell>
                                <TableBodyCell>
                                    {#if listItem.active}
                                        <span class="badge bg-success">Actif</span>
                                    {:else}
                                        <span class="badge bg-danger">Inactif</span>
                                    {/if}
                                </TableBodyCell>
                                <TableBodyCell>{formatDate(listItem.list_lastcalldate) || "N/A"}</TableBodyCell>
                            </TableBodyRow>
                        {/each}
                    {:else}
                        <TableBodyRow>
                            <TableBodyCell colspan="7" class="text-center">Aucune liste associée à cette campagne.</TableBodyCell>
                        </TableBodyRow>
                    {/if}
                </TableBody>
            </Table>
        </div>
         
    {/if}
{/if}