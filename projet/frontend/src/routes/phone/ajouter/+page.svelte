<script>
    import { fetchWithAuth } from '$lib/utils/fetchWithAuth.js';
    import { onMount } from 'svelte';
    
    // Formulaire avec valeurs par défaut
    let formData = {
        phoneExtension: '',
        dialPlanNumber: '',
        voicemailBox: '',
        outboundCallerID: '',
        adminUserGroup: '',
        serverIP: '',
        agentScreenLogin: '',
        loginPassword: '',
        registrationPassword: '',
        status: 'ACTIVE',
        activeAccount: true,
        phoneType: '',
        fullName: '',
        clientProtocol: 'SIP',
    };

    // Variables d'état
    let isSubmitting = false;
    let submitMessage = '';
    let submitError = false;
    let userGroups = [];
    let loading = true;
    let loadError = false;
    
    // Variables pour les champs de mot de passe
    let showLoginPassword = false;
    let showRegistrationPassword = false;
    
    // Récupération des groupes d'utilisateurs
    onMount(async () => {
        try {
            loading = true;
            const response = await fetchWithAuth('http://localhost:8000/api/admin/usergroup/getUsersGroups');
            
            if (!response.ok) {
                throw new Error('Failed to fetch user groups');
            }
            
            const data = await response.json();
            
            // Vérifier le format de la réponse et extraire les groupes
            if (Array.isArray(data)) {
                userGroups = data;
            } else if (data.data && Array.isArray(data.data)) {
                userGroups = data.data;
            } else if (data.groups && Array.isArray(data.groups)) {
                userGroups = data.groups;
            } else {
                // Si aucun format attendu n'est trouvé, utiliser des données fictives
                userGroups = [
                    { user_group: 'ADMIN', group_name: 'Administrators' },
                    { user_group: 'AGENTS', group_name: 'Call Agents' },
                    { user_group: 'MANAGERS', group_name: 'Team Managers' },
                    { user_group: 'MC_LEAD', group_name: 'MC_LEAD' },
                    { user_group: 'SUPPORT', group_name: 'Technical Support' }
                ];
            }
            
            loadError = false;
        } catch (error) {
            console.error('Error fetching user groups:', error);
            loadError = true;
            
            // Données fictives en cas d'erreur
            userGroups = [
                { user_group: 'ADMIN', group_name: 'Administrators' },
                { user_group: 'AGENTS', group_name: 'Call Agents' },
                { user_group: 'MANAGERS', group_name: 'Team Managers' },
                { user_group: 'MC_LEAD', group_name: 'MC_LEAD' },
                { user_group: 'SUPPORT', group_name: 'Technical Support' }
            ];
        } finally {
            loading = false;
        }
    });
    
    // Fonction pour basculer la visibilité des mots de passe
    const togglePasswordVisibility = (field) => {
        if (field === 'login') {
            showLoginPassword = !showLoginPassword;
        } else if (field === 'registration') {
            showRegistrationPassword = !showRegistrationPassword;
        }
    };

    // Fonction de soumission du formulaire
    const handleSubmit = async () => {
        try {
            isSubmitting = true;
            submitMessage = '';
            submitError = false;
            
            // Map form data to API expected format
            const apiData = {
                extension: formData.phoneExtension,
                dialplan_number: formData.dialPlanNumber,
                voicemail_id: formData.voicemailBox,
                outbound_cid: formData.outboundCallerID,
                user_group: formData.adminUserGroup,
                server_ip: formData.serverIP,
                login: formData.agentScreenLogin,
                pass: formData.loginPassword,
                conf_secret: formData.registrationPassword,
                status: formData.status,
                active: formData.activeAccount ? 'Y' : 'N',
                phone_type: formData.phoneType,
                fullname: formData.fullName,
                protocol: formData.clientProtocol
            };
            
            console.log('Sending data to API:', apiData);
            
            const response = await fetchWithAuth('http://localhost:8000/api/admin/phone/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(apiData)
            });
            
            const result = await response.json();
            
            if (!response.ok) {
                submitError = true;
                throw new Error(result.message || 'Failed to add phone');
            }
            
            submitMessage = 'Téléphone ajouté avec succès!';
            
            // Reset form after successful submission
            formData = {
                phoneExtension: '',
                dialPlanNumber: '',
                voicemailBox: '',
                outboundCallerID: '',
                adminUserGroup: '',
                serverIP: '',
                agentScreenLogin: '',
                loginPassword: '',
                registrationPassword: '',
                status: 'ACTIVE',
                activeAccount: true,
                phoneType: '',
                fullName: '',
                clientProtocol: 'SIP'
            };
            
        } catch (error) {
            console.error(error);
            submitError = true;
            submitMessage = error.message || 'Une erreur est survenue lors de l\'ajout du téléphone';
        } finally {
            isSubmitting = false;
            
            // Auto-hide message after 5 seconds
            setTimeout(() => {
                submitMessage = '';
            }, 5000);
        }
    };
    
    // Fonction pour annuler et réinitialiser le formulaire
    const handleCancel = () => {
        formData = {
            phoneExtension: '',
            dialPlanNumber: '',
            voicemailBox: '',
            outboundCallerID: '',
            adminUserGroup: '',
            serverIP: '',
            agentScreenLogin: '',
            loginPassword: '',
            registrationPassword: '',
            status: 'ACTIVE',
            activeAccount: true,
            phoneType: '',
            fullName: '',
            clientProtocol: 'SIP'
        };
    };
</script>

<div class="container py-4">
    <div class="row justify-content-center">
        <div class="container mt-4 mb-5">
    <div class="card shadow-sm border-0">
        <div class="card-header bg-primary text-white text-center py-3">
            <h3 class="mb-0"><i class="bi bi-telephone-plus me-2"></i>Ajouter un téléphone</h3>
        </div>
        <div class="card-body p-4">
            {#if submitMessage}
                <div class="alert alert-{submitError ? 'danger' : 'success'} alert-dismissible fade show" role="alert">
                    <i class="bi bi-{submitError ? 'exclamation-triangle' : 'check-circle'} me-2"></i>
                    {submitMessage}
                    <button type="button" class="btn-close" on:click={() => submitMessage = ''}></button>
                </div>
            {/if}
            
            <form on:submit|preventDefault={handleSubmit}>
                <div class="row g-4">
                    <!-- Colonne gauche -->
                    <div class="col-md-6">
                        <div class="card h-100 border-0 bg-light">
                            <div class="card-body">
                                <h5 class="card-title border-bottom pb-2 mb-3"><i class="bi bi-info-circle me-2"></i>Informations de base</h5>
                                
                                <div class="mb-3">
                                    <label for="phoneExtension" class="form-label fw-semibold">Phone Extension <span class="text-danger">*</span></label>
                                    <input type="text" class="form-control" id="phoneExtension" bind:value={formData.phoneExtension} required>
                                    <div class="form-text">Numéro d'extension unique pour ce téléphone</div>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="dialPlanNumber" class="form-label fw-semibold">Dial Plan Number <span class="text-danger">*</span></label>
                                    <input type="text" class="form-control" id="dialPlanNumber" bind:value={formData.dialPlanNumber} required>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="voicemailBox" class="form-label fw-semibold">Voicemail Box</label>
                                    <input type="text" class="form-control" id="voicemailBox" bind:value={formData.voicemailBox}>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="outboundCallerID" class="form-label fw-semibold">Outbound Caller ID</label>
                                    <input type="text" class="form-control" id="outboundCallerID" bind:value={formData.outboundCallerID}>
                                    <div class="form-text">ID d'appelant affiché lors des appels sortants</div>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="adminUserGroup" class="form-label fw-semibold">Admin User Group <span class="text-danger">*</span></label>
                                    <select class="form-select" id="adminUserGroup" bind:value={formData.adminUserGroup} required>
                                        <option value="">Sélectionner un groupe</option>
                                        {#if loading}
                                            <option disabled>Chargement des groupes...</option>
                                        {:else if loadError}
                                            <option disabled>Erreur de chargement des groupes</option>
                                        {:else}
                                            {#each userGroups as group}
                                                <option value={group.user_group || group.id || group.value}>
                                                    {group.group_name || group.name || group.user_group || group.id || group.value}
                                                </option>
                                            {/each}
                                        {/if}
                                    </select>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="serverIP" class="form-label fw-semibold">Server IP <span class="text-danger">*</span></label>
                                    <input type="text" class="form-control" id="serverIP" bind:value={formData.serverIP} required>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Colonne droite -->
                    <div class="col-md-6">
                        <div class="card h-100 border-0 bg-light">
                            <div class="card-body">
                                <h5 class="card-title border-bottom pb-2 mb-3"><i class="bi bi-shield-lock me-2"></i>Authentification & Configuration</h5>
                                
                                <div class="mb-3">
                                    <label for="agentScreenLogin" class="form-label fw-semibold">Agent Screen Login <span class="text-danger">*</span></label>
                                    <input type="text" class="form-control" id="agentScreenLogin" bind:value={formData.agentScreenLogin} required>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="loginPassword" class="form-label fw-semibold">Login Password <span class="text-danger">*</span></label>
                                    <div class="input-group">
                                        {#if showLoginPassword}
                                            <input type="text" class="form-control" id="loginPassword" bind:value={formData.loginPassword} required>
                                        {:else}
                                            <input type="password" class="form-control" id="loginPassword" bind:value={formData.loginPassword} required>
                                        {/if}
                                        <button class="btn btn-outline-secondary" type="button" on:click={() => togglePasswordVisibility('login')}>
                                            <i class="bi bi-{showLoginPassword ? 'eye-slash' : 'eye'}"></i>
                                        </button>
                                    </div>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="registrationPassword" class="form-label fw-semibold">Registration Password <span class="text-danger">*</span></label>
                                    <div class="input-group">
                                        {#if showRegistrationPassword}
                                            <input type="text" class="form-control" id="registrationPassword" bind:value={formData.registrationPassword} required>
                                        {:else}
                                            <input type="password" class="form-control" id="registrationPassword" bind:value={formData.registrationPassword} required>
                                        {/if}
                                        <button class="btn btn-outline-secondary" type="button" on:click={() => togglePasswordVisibility('registration')}>
                                            <i class="bi bi-{showRegistrationPassword ? 'eye-slash' : 'eye'}"></i>
                                        </button>
                                    </div>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="status" class="form-label">Status</label>
                                    <select 
                                        id="status" 
                                        class="form-select" 
                                        bind:value={formData.status}
                                    >
                                        <option>ACTIVE</option>
                                        <option>INACTIVE</option>
                                    </select>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="activeAccount" class="form-label">Active Account</label>
                                    <div class="form-check form-switch">
                                        <input 
                                            class="form-check-input" 
                                            type="checkbox" 
                                            id="activeAccount" 
                                            bind:checked={formData.activeAccount}
                                        >
                                        <label class="form-check-label" for="activeAccount">
                                            {formData.activeAccount ? 'Yes' : 'No'}
                                        </label>
                                    </div>
                                </div>
                                
                                <div class="mb-3">
                                    <label for="phoneType" class="form-label">Phone Type</label>
                                    <input 
                                        id="phoneType" 
                                        type="text" 
                                        class="form-control" 
                                        bind:value={formData.phoneType} 
                                    />
                                </div>
                                
                                <div class="mb-3">
                                    <label for="fullName" class="form-label">Full Name</label>
                                    <input 
                                        id="fullName" 
                                        type="text" 
                                        class="form-control" 
                                        bind:value={formData.fullName} 
                                    />
                                </div>
                                
                                <div class="mb-3">
                                    <label for="clientProtocol" class="form-label">Client Protocol</label>
                                    <select 
                                        id="clientProtocol" 
                                        class="form-select" 
                                        bind:value={formData.clientProtocol}
                                    >
                                        <option>SIP</option>
                                        <option>ZAP</option>
                                        <option>IAX2</option>
                                        <option>EXTERNAL</option>
                                        <option>DAHDI</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        
                        <div class="d-grid gap-2 d-md-flex justify-content-md-end mt-4">
                            <button type="button" class="btn btn-outline-secondary me-md-2">
                                <i class="bi bi-x-circle me-1"></i> Annuler
                            </button>
                            <button type="submit" class="btn btn-primary" disabled={isSubmitting}>
                                {#if isSubmitting}
                                    <span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                    Enregistrement...
                                {:else}
                                    <i class="bi bi-check-circle me-1"></i> Enregistrer
                                {/if}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Pas de styles CSS personnalisés nécessaires, utilisation exclusive de Bootstrap -->