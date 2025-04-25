<script lang="ts">
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import { fetchWithAuth } from '$lib/utils/fetchWithAuth.js';
    
    // API configuration
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    
    // Get phone extension from URL (accepting both 'extension' and 'id' parameters for compatibility)
    const phoneExtension = $page.url.searchParams.get('extension') || $page.url.searchParams.get('id') || '';

    // Form data
    let dialPlanNumber = '';
    let outboundCallerID = '';
    let adminUserGroup = '';
    let phoneIpaddress = '';
    let agentScreenLogin = '';
    let loginPassword = '';
    let phoneActive = 'N'; // Valeur par défaut pour le statut actif (N = inactif, Y = actif)
    
    // User groups data
    let userGroups: Array<{user_group: string, group_name: string}> = [];
    let loadingUserGroups = false;

    // UI state
    let isLoading = true;
    let errorMessage = '';
    let successMessage = '';
    let animateForm = false;
    let updateStatus: { field: string; status: string; message: string } = {
        field: '',
        status: '', // 'success', 'error', 'loading'
        message: ''
    };
    // Fonction pour gérer la modification d'un champ individuel
    async function handleFieldUpdate(field: string, value: string) {
        if (!value.trim()) return;

        isLoading = true;
        errorMessage = '';
        successMessage = '';

        try {
            // Créer un objet avec seulement le champ modifié
            const updateData: Record<string, string> = {};
            updateData[field] = value;

            // Appeler l'API pour mettre à jour uniquement ce champ
            const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/phone/${phoneExtension}`, {
                method: 'PUT',
                body: JSON.stringify(updateData)
            });

            if (!response.ok) {
                throw new Error(`Échec de la mise à jour: ${response.status}`);
            }

            successMessage = `Champ ${field} mis à jour avec succès!`;
            setTimeout(() => {
                successMessage = '';
            }, 3000);

            updateStatus = {
                field,
                status: 'success',
                message: `Champ ${field} mis à jour avec succès!`
            };

            setTimeout(() => {
                updateStatus = {
                    field: '',
                    status: '',
                    message: ''
                };
            }, 5000);

        } catch (error) {
            console.error('Erreur:', error);
            errorMessage = `Erreur lors de la mise à jour: ${error instanceof Error ? error.message : 'Erreur inconnue'}`;

            updateStatus = {
                field,
                status: 'error',
                message: errorMessage
            };

            setTimeout(() => {
                updateStatus = {
                    field: '',
                    status: '',
                    message: ''
                };
            }, 5000);
        } finally {
            isLoading = false;
        }
    }

    // Fonction pour obtenir la classe CSS en fonction du statut de mise à jour
    function getStatusClass(field: string): string {
        if (updateStatus.field !== field) return '';

        switch (updateStatus.status) {
            case 'loading': return 'field-loading';
            case 'success': return 'field-success';
            case 'error': return 'field-error';
            default: return '';
        }
    }

    // Fonction pour obtenir l'icône en fonction du statut de mise à jour
    function getStatusIcon(field: string): string {
        if (updateStatus.field !== field) return '';

        switch (updateStatus.status) {
            case 'loading': return '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>';
            case 'success': return '<i class="bi bi-check-circle-fill text-success"></i>';
            case 'error': return '<i class="bi bi-exclamation-circle-fill text-danger"></i>';
            default: return '';
        }
    }
    
    // Charger les groupes d'utilisateurs
    async function loadUserGroups() {
        loadingUserGroups = true;
        try {
            const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/userGroup/getUsersGroups`);
            
            if (!response.ok) {
                throw new Error(`Erreur lors de la récupération des groupes: ${response.status}`);
            }
            
            userGroups = await response.json();
        } catch (error) {
            console.error('Failed to fetch user groups:', error);
            // On n'affiche pas d'erreur pour ne pas perturber l'expérience utilisateur
        } finally {
            loadingUserGroups = false;
        }
    }

    // Charger les données du téléphone au montage du composant
    onMount(async () => {
        if (!phoneExtension) {
            errorMessage = 'Aucune extension de téléphone spécifiée';
            isLoading = false;
            return;
        }

        try {
            // Charger les groupes d'utilisateurs en parallèle
            loadUserGroups();
            
            const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/phone/${phoneExtension}`);
            
            if (!response.ok) {
                throw new Error(`Erreur lors de la récupération des données: ${response.status}`);
            }
            
            const phoneData = await response.json();
            
            // Populate form with phone data
            dialPlanNumber = phoneData.dialplan_number || '';
            outboundCallerID = phoneData.outbound_cid || '';
            adminUserGroup = phoneData.user_group || '';
            phoneIpaddress = phoneData.server_ip || '';
            agentScreenLogin = phoneData.login || '';
            loginPassword = phoneData.pass || '';
            phoneActive = phoneData.active || 'N';
            
            // Animate form after data is loaded
            setTimeout(() => {
                animateForm = true;
            }, 100);
            
        } catch (error) {
            console.error('Failed to fetch phone details:', error);
            errorMessage = `Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`;
        } finally {
            isLoading = false;
        }
    });

    async function handleSubmit() {
        isLoading = true;
        errorMessage = '';
        successMessage = '';

        try {
            // Update phone by current extension
            const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/phone/${phoneExtension}`, {
                method: 'PUT',
                body: JSON.stringify({
                    extension: phoneExtension,
                    dialplan_number: dialPlanNumber,
                    outbound_cid: outboundCallerID,
                    user_group: adminUserGroup,
                    server_ip: phoneIpaddress,
                    login: agentScreenLogin,
                    pass: loginPassword
                })
            });

            const contentType = response.headers.get('content-type');

            if (!response.ok) {
                const errorData = contentType?.includes('application/json')
                    ? await response.json()
                    : { message: `Server error: ${response.status}` };
                throw new Error(errorData.message || 'Failed to update phone');
            }

            successMessage = 'Phone updated successfully!';

            // Show success animation
            animateForm = false;
            setTimeout(() => {
                animateForm = true;
            }, 300);

            // Redirect to list after delay
            setTimeout(() => {
                // goto('/phone/afficher');
            }, 2000);
        } catch (error) {
            console.error('Error:', error);
            errorMessage = 'Error updating phone: ' + (error instanceof Error ? error.message : 'Unknown error occurred');
        } finally {
            isLoading = false;
        }
    }
</script>

<div class="main-container py-4">
    <!-- Breadcrumb with modern styling -->
    <nav aria-label="breadcrumb" class="mb-4 fade-in">
        <ol class="breadcrumb glass-breadcrumb p-2 rounded">
            <li class="breadcrumb-item"><a href="/" class="text-decoration-none"><i class="bi bi-house me-1"></i>Accueil</a></li>
            <li class="breadcrumb-item"><a href="/phone/afficher" class="text-decoration-none"><i class="bi bi-telephone me-1"></i>Téléphones</a></li>
            <li class="breadcrumb-item active" aria-current="page">Détails</li>
        </ol>
    </nav>

    <!-- Alert Messages -->
    {#if errorMessage}
        <div class="alert alert-danger alert-dismissible fade show" role="alert">
            <i class="bi bi-exclamation-triangle-fill me-2"></i>
            {errorMessage}
            <button type="button" class="btn-close" on:click={() => errorMessage = ''} aria-label="Close"></button>
        </div>
    {/if}

    {#if successMessage}
        <div class="alert alert-success alert-dismissible fade show" role="alert">
            <i class="bi bi-check-circle-fill me-2"></i>
            {successMessage}
            <button type="button" class="btn-close" on:click={() => successMessage = ''} aria-label="Close"></button>
        </div>
    {/if}

    <!-- Loading State -->
    {#if isLoading}
        <div class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-3">Chargement des données...</p>
        </div>
    {:else}
        <!-- Main Content Card -->
        <div class="card glass-card shadow-sm border-0 mb-4 {animateForm ? 'animate-card' : ''}">
            <div class="card-header bg-transparent py-3 d-flex justify-content-between align-items-center">
                <h5 class="mb-0"><i class="bi bi-telephone-fill me-2"></i>Détails du téléphone</h5>
                <a href="/phone/afficher" class="btn btn-outline-primary btn-sm">
                    <i class="bi bi-arrow-left me-1"></i>Retour à la liste
                </a>
            </div>
            <div class="card-body p-4">
                <div class="{animateForm ? 'animate-form' : ''}">
                    <!-- Informations de base -->
                    <div class="mb-4">
                        <h6 class="text-primary mb-3"><i class="bi bi-info-circle-fill me-2"></i>Informations de base</h6>
                        <div class="row g-3">
                            <div class="col-md-6">
                                <div class="detail-item">
                                    <label class="detail-label" id="label-extension">Extension</label>
                                    <div class="detail-value readonly" aria-labelledby="label-extension">{phoneExtension}</div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="detail-item">
                                    <label class="detail-label" id="label-active" for="phoneActiveSwitch">Statut du téléphone</label>
                                    <div class="input-with-status {getStatusClass('active')}">
                                        <div class="d-flex align-items-center">
                                            <div class="form-check form-switch me-2">
                                                <input 
                                                    class="form-check-input" 
                                                    type="checkbox" 
                                                    id="phoneActiveSwitch"
                                                    checked={phoneActive === 'Y'}
                                                    on:change={(e) => {
                                                        const newValue = e.currentTarget.checked ? 'Y' : 'N';
                                                        handleFieldUpdate('active', newValue);
                                                        phoneActive = newValue;
                                                    }}
                                                >
                                            </div>
                                            <div class="status-badge {phoneActive === 'Y' ? 'bg-success' : 'bg-danger'} text-white px-3 py-1 rounded-pill">
                                                {phoneActive === 'Y' ? 'Actif' : 'Inactif'}
                                            </div>
                                        </div>
                                        {#if updateStatus.field === 'active'}
                                            <div class="status-indicator">
                                                {#if updateStatus.status === 'loading'}
                                                    <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                                {:else if updateStatus.status === 'success'}
                                                    <i class="bi bi-check-circle-fill text-success"></i>
                                                {:else if updateStatus.status === 'error'}
                                                    <i class="bi bi-exclamation-circle-fill text-danger"></i>
                                                {/if}
                                            </div>
                                            <div class="status-message {updateStatus.status}">{updateStatus.message}</div>
                                        {/if}
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="detail-item">
                                    <label class="detail-label" id="label-dialplan" for="dialPlanNumber">Numéro de plan de numérotation</label>
                                    <div class="input-with-status {getStatusClass('dialplan_number')}">
                                        <input 
                                            type="text" 
                                            class="form-control glass-input" 
                                            id="dialPlanNumber"
                                            value={dialPlanNumber}
                                            on:keydown={(e) => e.key === 'Enter' && handleFieldUpdate('dialplan_number', e.currentTarget.value)}
                                            placeholder="Entrer le numéro de plan"
                                            aria-labelledby="label-dialplan"
                                        />
                                        {#if updateStatus.field === 'dialplan_number'}
                                            <div class="status-indicator">
                                                {#if updateStatus.status === 'loading'}
                                                    <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                                {:else if updateStatus.status === 'success'}
                                                    <i class="bi bi-check-circle-fill text-success"></i>
                                                {:else if updateStatus.status === 'error'}
                                                    <i class="bi bi-exclamation-circle-fill text-danger"></i>
                                                {/if}
                                            </div>
                                            <div class="status-message {updateStatus.status}">{updateStatus.message}</div>
                                        {/if}
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="detail-item">
                                    <label class="detail-label" id="label-outbound" for="outboundCallerID">ID d'appelant sortant</label>
                                    <div class="input-with-status {getStatusClass('outbound_cid')}">
                                        <input 
                                            type="text" 
                                            class="form-control glass-input" 
                                            id="outboundCallerID"
                                            value={outboundCallerID}
                                            on:keydown={(e) => e.key === 'Enter' && handleFieldUpdate('outbound_cid', e.currentTarget.value)}
                                            placeholder="Entrer l'ID d'appelant sortant"
                                            aria-labelledby="label-outbound"
                                        />
                                        {#if updateStatus.field === 'outbound_cid'}
                                            <div class="status-indicator">
                                                {#if updateStatus.status === 'loading'}
                                                    <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                                {:else if updateStatus.status === 'success'}
                                                    <i class="bi bi-check-circle-fill text-success"></i>
                                                {:else if updateStatus.status === 'error'}
                                                    <i class="bi bi-exclamation-circle-fill text-danger"></i>
                                                {/if}
                                            </div>
                                            <div class="status-message {updateStatus.status}">{updateStatus.message}</div>
                                        {/if}
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="detail-item">
                                    <label class="detail-label" id="label-usergroup" for="adminUserGroup">Groupe d'utilisateurs</label>
                                    <select 
                                        class="form-select glass-input" 
                                        id="adminUserGroup"
                                        bind:value={adminUserGroup}
                                        on:change={(e) => handleFieldUpdate('user_group', e.currentTarget.value)}
                                        aria-labelledby="label-usergroup"
                                    >
                                        <option value="">Sélectionner un groupe</option>
                                        {#if loadingUserGroups}
                                            <option value="" disabled>Chargement des groupes...</option>
                                        {:else}
                                            {#each userGroups as group}
                                                <option value={group.user_group}>{group.group_name || group.user_group}</option>
                                            {/each}
                                        {/if}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Paramètres réseau -->
                    <div class="mb-4">
                        <h6 class="text-primary mb-3"><i class="bi bi-hdd-network-fill me-2"></i>Paramètres réseau</h6>
                        <div class="row g-3">
                            <div class="col-md-6">
                                <div class="detail-item">
                                    <label class="detail-label" id="label-ip" for="phoneIpaddress">Adresse IP du téléphone</label>
                                    <div class="input-with-status {getStatusClass('server_ip')}">
                                        <input 
                                            type="text" 
                                            class="form-control glass-input" 
                                            id="phoneIpaddress"
                                            value={phoneIpaddress}
                                            on:keydown={(e) => e.key === 'Enter' && handleFieldUpdate('server_ip', e.currentTarget.value)}
                                            placeholder="Entrer l'adresse IP"
                                            aria-labelledby="label-ip"
                                        />
                                        {#if updateStatus.field === 'server_ip'}
                                            <div class="status-indicator">
                                                {#if updateStatus.status === 'loading'}
                                                    <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                                {:else if updateStatus.status === 'success'}
                                                    <i class="bi bi-check-circle-fill text-success"></i>
                                                {:else if updateStatus.status === 'error'}
                                                    <i class="bi bi-exclamation-circle-fill text-danger"></i>
                                                {/if}
                                            </div>
                                            <div class="status-message {updateStatus.status}">{updateStatus.message}</div>
                                        {/if}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Authentification -->
                    <div class="mb-4">
                        <h6 class="text-primary mb-3"><i class="bi bi-shield-lock-fill me-2"></i>Authentification</h6>
                        <div class="row g-3">
                            <div class="col-md-6">
                                <div class="detail-item">
                                    <label class="detail-label" id="label-agent" for="agentScreenLogin">Identifiant d'écran d'agent</label>
                                    <div class="input-with-status {getStatusClass('login')}">
                                        <input 
                                            type="text" 
                                            class="form-control glass-input" 
                                            id="agentScreenLogin"
                                            value={agentScreenLogin}
                                            on:keydown={(e) => e.key === 'Enter' && handleFieldUpdate('login', e.currentTarget.value)}
                                            placeholder="Entrer l'identifiant"
                                            aria-labelledby="label-agent"
                                        />
                                        {#if updateStatus.field === 'login'}
                                            <div class="status-indicator">
                                                {#if updateStatus.status === 'loading'}
                                                    <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                                {:else if updateStatus.status === 'success'}
                                                    <i class="bi bi-check-circle-fill text-success"></i>
                                                {:else if updateStatus.status === 'error'}
                                                    <i class="bi bi-exclamation-circle-fill text-danger"></i>
                                                {/if}
                                            </div>
                                            <div class="status-message {updateStatus.status}">{updateStatus.message}</div>
                                        {/if}
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="detail-item">
                                    <label class="detail-label" id="label-password" for="loginPassword">Mot de passe</label>
                                    <div class="input-with-status {getStatusClass('pass')}">
                                        <input 
                                            type="password" 
                                            class="form-control glass-input" 
                                            id="loginPassword"
                                            value={loginPassword}
                                            on:keydown={(e) => e.key === 'Enter' && handleFieldUpdate('pass', e.currentTarget.value)}
                                            placeholder="Entrer le mot de passe"
                                            aria-labelledby="label-password"
                                        />
                                        {#if updateStatus.field === 'pass'}
                                            <div class="status-indicator">
                                                {#if updateStatus.status === 'loading'}
                                                    <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                                {:else if updateStatus.status === 'success'}
                                                    <i class="bi bi-check-circle-fill text-success"></i>
                                                {:else if updateStatus.status === 'error'}
                                                    <i class="bi bi-exclamation-circle-fill text-danger"></i>
                                                {/if}
                                            </div>
                                            <div class="status-message {updateStatus.status}">{updateStatus.message}</div>
                                        {/if}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="alert alert-info mt-4">
                        <i class="bi bi-info-circle-fill me-2"></i>
                        Modifiez un champ et appuyez sur <strong>Entrée</strong> pour enregistrer les modifications.
                    </div>
                </div>
            </div>
        </div>
    {/if}
</div>

<style>
    /* Base Styles */
    .main-container {
        min-height: 100vh;
        padding-bottom: 2rem;
        background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
        background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
    }

    /* Page Header */
    .page-header {
        position: relative;
        padding: 2rem 0;
        border-radius: 0.5rem;
        overflow: hidden;
        background: linear-gradient(90deg, #0d6efd, #0dcaf0);
        box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
        margin-bottom: 2rem;
    }

    .header-content {
        position: relative;
        z-index: 2;
        padding: 0 2rem;
        color: white;
    }

    .header-decoration {
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        width: 30%;
        background-image: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='white' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E");
        opacity: 0.5;
        z-index: 1;
    }

    /* Glass Morphism Effects */
    .glass-card {
        background: rgba(255, 255, 255, 0.7);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        box-shadow: 0 8px 32px rgba(31, 38, 135, 0.1);
    }
    
    .glass-breadcrumb {
        background: rgba(255, 255, 255, 0.7);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
    }
    
    .glass-input {
        background: rgba(255, 255, 255, 0.6) !important;
        border: 1px solid rgba(255, 255, 255, 0.2) !important;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
    }
    
    .glass-input:focus {
        background: rgba(255, 255, 255, 0.8) !important;
        box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.15) !important;
    }
    
    /* Card Enhancements */
    .glass-card, .card {
        position: relative;
        overflow: hidden;
        border: none;
    }
    
    .glass-card::before, .card::before {
        content: '';
        position: absolute;
        top: -10px;
        left: -10px;
        right: -10px;
        bottom: -10px;
        background: linear-gradient(45deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
        filter: blur(20px);
        z-index: -1;
    }
    
    /* Detail Item Styling */
    .detail-item {
        margin-bottom: 1.5rem;
        position: relative;
    }

    .detail-label {
        display: block;
        font-size: 0.875rem;
        font-weight: 600;
        color: #4a6bff;
        margin-bottom: 0.5rem;
    }

    .detail-value {
        padding: 0.75rem 1rem;
        background-color: rgba(255, 255, 255, 0.1);
        border-radius: 0.5rem;
        border: 1px solid rgba(255, 255, 255, 0.2);
        font-size: 1rem;
    }

    .detail-value.readonly {
        background-color: rgba(0, 0, 0, 0.05);
        color: #6c757d;
        font-weight: 500;
    }
    
    /* Status indicators for input fields */
    .input-with-status {
        position: relative;
    }
    
    .status-indicator {
        position: absolute;
        right: 10px;
        top: 50%;
        transform: translateY(-50%);
        z-index: 2;
    }
    
    .status-message {
        position: absolute;
        top: calc(100% + 5px);
        left: 0;
        font-size: 0.75rem;
        width: 100%;
        padding: 2px 5px;
        border-radius: 4px;
        animation: fadeIn 0.3s ease-in-out;
    }
    
    .status-message.success {
        color: #198754;
        background-color: rgba(25, 135, 84, 0.1);
    }
    
    .status-message.error {
        color: #dc3545;
        background-color: rgba(220, 53, 69, 0.1);
    }
    
    .status-message.loading {
        color: #0d6efd;
        background-color: rgba(13, 110, 253, 0.1);
    }
    
    .field-success .glass-input {
        border-color: #198754;
    }
    
    .field-error .glass-input {
        border-color: #dc3545;
    }
    
    .field-loading .glass-input {
        border-color: #0d6efd;
    }
    
    /* Animations */
    .animate-card {
        animation: cardPop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        transform: scale(0.95);
        opacity: 0.5;
    }
    
    .animate-form {
        animation: formFadeIn 0.5s ease forwards;
    }
    
    @keyframes cardPop {
        from { transform: scale(0.95); opacity: 0.5; }
        to { transform: scale(1); opacity: 1; }
    }
    
    @keyframes formFadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    .fade-in {
        animation: fadeIn 0.5s ease-in-out;
    }
    
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    /* Responsive adjustments */
    @media (max-width: 767.98px) {
        .header-content {
            padding: 0 1rem;
        }
        
        .page-header {
            padding: 1.5rem 0;
        }
        
        .card-header {
            flex-direction: column;
            gap: 1rem;
        }
        
        .row.g-3 > [class*="col-"] {
            padding-left: 0.5rem;
            padding-right: 0.5rem;
        }
    }

</style>
