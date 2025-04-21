<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { fetchWithAuth } from '$lib/utils/fetchWithAuth.js';

    // API configuration
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

    // Form data
    let phoneExtension = '';
    let dialPlanNumber = '';
    let voicemailBox = '';
    let outboundCallerId = '';
    let serverIP = '';
    let agentScreenLogin = '';
    let loginPassword = '';
    let registrationPassword = '';
    let fullName = '';
    let selectedPhone = '';
    let phoneActive = 'Y'; // Y = actif, N = inactif
    let userGroup = '';
    
    // UI state
    let isLoading = false;
    let isSubmitting = false;
    let errorMessage = '';
    let successMessage = '';
    let phones: any[] = [];
    let userGroups: any[] = [];
    
    // Charger la liste des téléphones et des groupes d'utilisateurs
    onMount(async () => {
        try {
            await Promise.all([
                loadPhones(),
                loadUserGroups()
            ]);
        } catch (error) {
            console.error('Failed to load initial data:', error);
            errorMessage = 'Erreur lors du chargement des données initiales';
        }
    });
    
    // Charger la liste des téléphones
    async function loadPhones() {
        isLoading = true;
        try {
            const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/phone/list`);
            
            if (!response.ok) {
                throw new Error(`Erreur lors de la récupération des téléphones: ${response.status}`);
            }
            
            phones = await response.json();
        } catch (error) {
            console.error('Failed to fetch phones:', error);
            errorMessage = `Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`;
        } finally {
            isLoading = false;
        }
    }
    
    // Charger les groupes d'utilisateurs
    async function loadUserGroups() {
        try {
            const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/userGroup/getUsersGroups`);
            
            if (!response.ok) {
                throw new Error(`Erreur lors de la récupération des groupes: ${response.status}`);
            }
            
            userGroups = await response.json();
        } catch (error) {
            console.error('Failed to fetch user groups:', error);
            errorMessage = `Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`;
        }
    }
    
    // Charger les détails d'un téléphone sélectionné
    async function loadPhoneDetails(extension: string) {
        if (!extension) return;
        
        try {
            const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/phone/${extension}`);
            
            if (!response.ok) {
                throw new Error(`Erreur lors de la récupération des détails: ${response.status}`);
            }
            
            const phoneData = await response.json();
            
            // Pré-remplir les champs avec les données du téléphone source
            // mais ne pas écraser les champs déjà remplis par l'utilisateur
            if (!dialPlanNumber) dialPlanNumber = phoneData.dialplan_number || '';
            if (!voicemailBox) voicemailBox = phoneData.voicemail_id || '';
            if (!outboundCallerId) outboundCallerId = phoneData.outbound_cid || '';
            if (!serverIP) serverIP = phoneData.server_ip || '';
            if (!userGroup) userGroup = phoneData.user_group || '';
            
            // Ne pas copier ces champs car ils doivent être uniques
            // phoneExtension, agentScreenLogin, loginPassword, registrationPassword, fullName
            
        } catch (error) {
            console.error('Failed to fetch phone details:', error);
            errorMessage = `Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`;
        }
    }
    
    // Gérer la soumission du formulaire
    async function handleSubmit() {
        if (!phoneExtension || !selectedPhone) {
            errorMessage = 'Veuillez remplir tous les champs obligatoires';
            return;
        }
        
        isSubmitting = true;
        errorMessage = '';
        successMessage = '';
        
        try {
            // Créer un nouveau téléphone basé sur les données du formulaire
            const phoneData = {
                extension: phoneExtension,
                dialplan_number: dialPlanNumber,
                voicemail_id: voicemailBox,
                outbound_cid: outboundCallerId,
                server_ip: serverIP,
                login: agentScreenLogin,
                pass: loginPassword,
                fullname: fullName,
                active: phoneActive,
                user_group: userGroup
            };
            
            const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/phone`, {
                method: 'POST',
                body: JSON.stringify(phoneData)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            successMessage = 'Téléphone copié avec succès!';
            
            // Rediriger vers la page de détail du nouveau téléphone après un court délai
            setTimeout(() => {
                goto(`/phone/detail/?extension=${phoneExtension}`);
            }, 2000);
            
        } catch (error) {
            console.error('Failed to copy phone:', error);
            errorMessage = `Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`;
        } finally {
            isSubmitting = false;
        }
    }
</script>

<div class="container py-4">
    <!-- Header avec titre et description -->
    <div class="header glass-card mb-4 p-4">
        <div class="row align-items-center">
            <div class="col-md-8">
                <h1 class="display-6 fw-bold mb-2"><i class="bi bi-telephone-plus-fill me-2 text-primary"></i>Copier un téléphone</h1>
                <p class="text-muted mb-0">Créez un nouveau téléphone en copiant les paramètres d'un téléphone existant.</p>
            </div>
            <div class="col-md-4 text-md-end mt-3 mt-md-0">
                <button class="btn btn-outline-primary" on:click={() => goto('/phone/afficher')}>
                    <i class="bi bi-arrow-left me-2"></i>Retour à la liste
                </button>
            </div>
        </div>
    </div>
    
    <!-- Messages d'erreur ou de succès -->
    {#if errorMessage}
        <div class="alert alert-danger alert-dismissible fade show" role="alert">
            <i class="bi bi-exclamation-triangle-fill me-2"></i> {errorMessage}
            <button type="button" class="btn-close" on:click={() => errorMessage = ''} aria-label="Close"></button>
        </div>
    {/if}
    
    {#if successMessage}
        <div class="alert alert-success alert-dismissible fade show" role="alert">
            <i class="bi bi-check-circle-fill me-2"></i> {successMessage}
            <button type="button" class="btn-close" on:click={() => successMessage = ''} aria-label="Close"></button>
        </div>
    {/if}
    
    <!-- Formulaire principal -->
    <div class="card glass-card shadow-sm border-0">
        <div class="card-body p-4">
            {#if isLoading}
                <div class="text-center py-5">
                    <div class="spinner-border text-primary" role="status">
                        <span class="visually-hidden">Chargement...</span>
                    </div>
                    <p class="mt-3 text-muted">Chargement des données...</p>
                </div>
            {:else}
                <form on:submit|preventDefault={handleSubmit}>
                    <div class="row g-3">
                        <!-- Téléphone source -->
                        <div class="col-12 mb-3">
                            <div class="card bg-light border-0">
                                <div class="card-header bg-primary bg-opacity-10 border-0">
                                    <h5 class="mb-0"><i class="bi bi-telephone-forward me-2"></i>Téléphone source</h5>
                                </div>
                                <div class="card-body">
                                    <div class="mb-3">
                                        <label for="selectedPhone" class="form-label">Sélectionner un téléphone à copier:</label>
                                        <select 
                                            id="selectedPhone" 
                                            class="form-select" 
                                            bind:value={selectedPhone}
                                            on:change={() => loadPhoneDetails(selectedPhone)}
                                        >
                                            <option value="">Sélectionner un téléphone</option>
                                            {#each phones as phone}
                                                <option value={phone.extension}>{phone.extension}, {phone.server_ip || 'N/A'}{phone.fullname ? ` - ${phone.fullname}` : ''}</option>
                                            {/each}
                                        </select>
                                        <div class="form-text">Les paramètres du téléphone sélectionné seront copiés vers le nouveau téléphone.</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Informations de base -->
                        <div class="col-12 mb-3">
                            <div class="card bg-light border-0">
                                <div class="card-header bg-primary bg-opacity-10 border-0">
                                    <h5 class="mb-0"><i class="bi bi-info-circle me-2"></i>Informations du nouveau téléphone</h5>
                                </div>
                                <div class="card-body">
                                    <div class="row g-3">
                                        <!-- Extension (obligatoire) -->
                                        <div class="col-md-6">
                                            <div class="mb-3">
                                                <label for="phoneExtension" class="form-label">Extension téléphonique <span class="text-danger">*</span></label>
                                                <input 
                                                    id="phoneExtension" 
                                                    type="text" 
                                                    class="form-control" 
                                                    bind:value={phoneExtension} 
                                                    placeholder="Ex: 2100"
                                                    required
                                                />
                                                <div class="form-text">Numéro d'extension unique pour ce téléphone.</div>
                                            </div>
                                        </div>
                                        
                                        <!-- Dial Plan Number -->
                                        <div class="col-md-6">
                                            <div class="mb-3">
                                                <label for="dialPlanNumber" class="form-label">Numéro de plan de numérotation</label>
                                                <input 
                                                    id="dialPlanNumber" 
                                                    type="text" 
                                                    class="form-control" 
                                                    bind:value={dialPlanNumber} 
                                                    placeholder="Ex: 2100"
                                                />
                                            </div>
                                        </div>
                                        
                                        <!-- Voicemail Box -->
                                        <div class="col-md-6">
                                            <div class="mb-3">
                                                <label for="voicemailBox" class="form-label">Boîte vocale</label>
                                                <input 
                                                    id="voicemailBox" 
                                                    type="text" 
                                                    class="form-control" 
                                                    bind:value={voicemailBox} 
                                                    placeholder="Ex: 2100"
                                                />
                                            </div>
                                        </div>
                                        
                                        <!-- Outbound Caller ID -->
                                        <div class="col-md-6">
                                            <div class="mb-3">
                                                <label for="outboundCallerId" class="form-label">ID d'appelant sortant</label>
                                                <input 
                                                    id="outboundCallerId" 
                                                    type="text" 
                                                    class="form-control" 
                                                    bind:value={outboundCallerId} 
                                                    placeholder="Ex: +33123456789"
                                                />
                                            </div>
                                        </div>
                                        
                                        <!-- Full Name -->
                                        <div class="col-md-6">
                                            <div class="mb-3">
                                                <label for="fullName" class="form-label">Nom complet</label>
                                                <input 
                                                    id="fullName" 
                                                    type="text" 
                                                    class="form-control" 
                                                    bind:value={fullName} 
                                                    placeholder="Ex: Jean Dupont"
                                                />
                                            </div>
                                        </div>
                                        
                                        <!-- User Group -->
                                        <div class="col-md-6">
                                            <div class="mb-3">
                                                <label for="userGroup" class="form-label">Groupe d'utilisateurs</label>
                                                <select 
                                                    id="userGroup" 
                                                    class="form-select" 
                                                    bind:value={userGroup}
                                                >
                                                    <option value="">Sélectionner un groupe</option>
                                                    {#each userGroups as group}
                                                        <option value={group.user_group}>{group.group_name || group.user_group}</option>
                                                    {/each}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Paramètres techniques -->
                        <div class="col-12 mb-3">
                            <div class="card bg-light border-0">
                                <div class="card-header bg-primary bg-opacity-10 border-0">
                                    <h5 class="mb-0"><i class="bi bi-gear me-2"></i>Paramètres techniques</h5>
                                </div>
                                <div class="card-body">
                                    <div class="row g-3">
                                        <!-- Server IP -->
                                        <div class="col-md-6">
                                            <div class="mb-3">
                                                <label for="serverIP" class="form-label">Adresse IP du serveur</label>
                                                <input 
                                                    id="serverIP" 
                                                    type="text" 
                                                    class="form-control" 
                                                    bind:value={serverIP} 
                                                    placeholder="Ex: 192.168.1.1"
                                                />
                                            </div>
                                        </div>
                                        
                                        <!-- Agent Screen Login -->
                                        <div class="col-md-6">
                                            <div class="mb-3">
                                                <label for="agentScreenLogin" class="form-label">Identifiant d'agent</label>
                                                <input 
                                                    id="agentScreenLogin" 
                                                    type="text" 
                                                    class="form-control" 
                                                    bind:value={agentScreenLogin} 
                                                    placeholder="Ex: agent2100"
                                                />
                                            </div>
                                        </div>
                                        
                                        <!-- Login Password -->
                                        <div class="col-md-6">
                                            <div class="mb-3">
                                                <label for="loginPassword" class="form-label">Mot de passe de connexion</label>
                                                <input 
                                                    id="loginPassword" 
                                                    type="password" 
                                                    class="form-control" 
                                                    bind:value={loginPassword} 
                                                    placeholder="Entrez un mot de passe"
                                                />
                                            </div>
                                        </div>
                                        
                                        <!-- Registration Password -->
                                        <div class="col-md-6">
                                            <div class="mb-3">
                                                <label for="registrationPassword" class="form-label">Mot de passe d'enregistrement</label>
                                                <input 
                                                    id="registrationPassword" 
                                                    type="password" 
                                                    class="form-control" 
                                                    bind:value={registrationPassword} 
                                                    placeholder="Entrez un mot de passe"
                                                />
                                            </div>
                                        </div>
                                        
                                        <!-- Active Status -->
                                        <div class="col-md-6">
                                            <div class="mb-3">
                                                <label class="form-label d-block" for="phoneActiveSwitch">Statut du téléphone</label>
                                                <div class="form-check form-switch">
                                                    <input 
                                                        class="form-check-input" 
                                                        type="checkbox" 
                                                        id="phoneActiveSwitch"
                                                        checked={phoneActive === 'Y'}
                                                        on:change={(e) => {
                                                            phoneActive = e.currentTarget.checked ? 'Y' : 'N';
                                                        }}
                                                    >
                                                    <label class="form-check-label" for="phoneActiveSwitch">
                                                        {phoneActive === 'Y' ? 'Actif' : 'Inactif'}
                                                    </label>
                                                </div>
                                                <div class="form-text">Détermine si le téléphone est actif dans le système.</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="d-flex justify-content-between align-items-center mt-4">
                        <div class="form-text">
                            <i class="bi bi-info-circle me-1"></i> Les champs marqués d'un <span class="text-danger">*</span> sont obligatoires.
                        </div>
                        <button type="submit" class="btn btn-primary btn-lg" disabled={isSubmitting}>
                            {#if isSubmitting}
                                <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                Traitement...
                            {:else}
                                <i class="bi bi-telephone-plus-fill me-2"></i>Créer le téléphone
                            {/if}
                        </button>
                    </div>
                </form>
            {/if}
        </div>
    </div>
</div>

<style>
    /* Styles pour la carte en verre */
    .glass-card {
        background: rgba(255, 255, 255, 0.7);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        box-shadow: 0 8px 32px rgba(31, 38, 135, 0.1);
    }
    
    /* Styles pour l'en-tête */
    .header {
        border-radius: 10px;
        overflow: hidden;
        position: relative;
    }
    
    .header::before {
        content: '';
        position: absolute;
        top: 0;
        right: 0;
        width: 30%;
        height: 100%;
        background: linear-gradient(135deg, transparent 0%, rgba(255, 255, 255, 0.1) 100%);
        z-index: 1;
    }
    
    /* Animations */
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    .card {
        animation: fadeIn 0.5s ease-out;
    }
    
    /* Styles responsifs */
    @media (max-width: 767.98px) {
        .header h1 {
            font-size: 1.5rem;
        }
    }
</style>