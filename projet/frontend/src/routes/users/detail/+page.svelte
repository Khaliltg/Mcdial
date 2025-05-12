<script>
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { fade, fly, slide } from "svelte/transition";
    import { fetchWithAuth } from '$lib/utils/fetchWithAuth.js';

    // Initialize the user object with default values
    let user = {
        access_recordings: "0",
        active: "Y",
        add_timeclock_log: "0",
        admin_cf_show_hidden: "0",
        admin_hide_lead_data: "0",
        admin_hide_phone_data: "0",
        agent_call_log_view_override: "DISABLED",
        agent_choose_blended: "1",
        agent_choose_ingroups: "1",
        agent_choose_territories: "1",
        agent_lead_search_override: "NOT_ACTIVE",
        agent_shift_enforcement_override: "DISABLED",
        agentcall_chat: "0",
        agentcall_email: "0",
        agentcall_manual: "0",
        agentonly_callbacks: "0",
        alert_enabled: "0",
        allow_alerts: "0",
        alter_admin_interface_options: "1",
        alter_agent_interface_options: "0",
        alter_custdata_override: "NOT_ACTIVE",
        alter_custphone_override: "NOT_ACTIVE",
        api_allowed_functions: "ALL_FUNCTIONS",
        api_list_restrict: "0",
        api_only_user: "0",
        ast_admin_access: "0",
        ast_delete_phones: "0",
        callcard_admin: "0",
        campaign_detail: "0",
        change_agent_campaign: "0",
        closer_campaigns: null,
        closer_default_blended: "0",
        custom_fields_modify: "0",
        custom_five: "",
        custom_four: "",
        custom_one: "",
        custom_three: "",
        custom_two: "",
        delete_call_times: "0",
        delete_campaigns: "0",
        delete_filters: "0",
        delete_from_dnc: "0",
        delete_inbound_dids: "0",
        delete_ingroups: "0",
        delete_lists: "0",
        delete_remote_agents: "0",
        delete_scripts: "0",
        delete_timeclock_log: "0",
        delete_user_groups: "0",
        delete_users: "0",
        download_invalid_files: "0",
        download_lists: "0",
        email: "",
        export_gdpr_leads: "0",
        export_reports: "0",
        failed_last_ip_today: "",
        failed_last_type_today: "",
        failed_login_attempts_today: 0,
        failed_login_count: 0,
        failed_login_count_today: 0,
        force_change_password: "N",
        full_name: "khalil",
        hci_enabled: "0",
        hide_call_log_info: "DISABLED",
        hotkeys_active: "0",
        ignore_group_on_search: "0",
        ignore_ip_list: "0",
        inbound_credits: -1,
        last_ip: "",
        last_login_date: "2000-12-31T23:00:01.000Z",
        lead_filter_id: "NONE",
        load_leads: "0",
        manager_shift_enforcement_override: "0",
        manual_dial_filter: "DISABLED",
        max_hopper_calls: 0,
        max_hopper_calls_hour: 0,
        max_inbound_calls: 0,
        max_inbound_filter_enabled: "0",
        max_inbound_filter_ingroups: null,
        max_inbound_filter_min_sec: -1,
        max_inbound_filter_statuses: null,
        mobile_number: "",
        modify_audiostore: "0",
        modify_auto_reports: "0",
        modify_call_times: "0",
        modify_campaigns: "0",
        modify_carriers: "0",
        modify_colors: "0",
        modify_contacts: "0",
        modify_custom_dialplans: "0",
        modify_dial_prefix: "0",
        modify_email_accounts: "0",
        modify_filters: "0",
        modify_inbound_dids: "0",
        modify_ingroups: "0",
        modify_ip_lists: "0",
        modify_labels: "0",
        modify_languages: "0",
        modify_leads: "0",
        modify_lists: "0",
        modify_moh: "0",
        modify_phones: "0",
        modify_remoteagents: "0",
        modify_same_user_level: "1",
        modify_scripts: "0",
        modify_servers: "0",
        modify_shifts: "0",
        modify_stamp: "2025-02-25T15:46:15.000Z",
        modify_statuses: "0",
        modify_timeclock_log: "0",
        modify_tts: "0",
        modify_usergroups: "0",
        modify_users: "0",
        modify_voicemail: "0",
        mute_recordings: "DISABLED",
        next_dial_my_callbacks: "NOT_ACTIVE",
        pass: "",
        pass_hash: "",
        pause_code_approval: "0",
        phone_login: null,
        phone_pass: null,
        preset_contact_search: "NOT_ACTIVE",
        qc_commit: "0",
        qc_enabled: "0",
        qc_finish: "0",
        qc_pass: "0",
        qc_user_level: 1,
        ready_max_logout: -1,
        realtime_block_user_info: "0",
        scheduled_callbacks: "1",
        selected_language: "default English",
        shift_override_flag: "0",
        status_group_id: "",
        territory: "",
        two_factor_override: "NOT_ACTIVE",
        user: "",
        user_admin_redirect_url: null,
        user_choose_language: "0",
        user_code: "",
        user_group: "test",
        user_group_two: "",
        user_hide_realtime: "0",
        user_id: 10,
        user_level: 8,
        user_location: "",
        user_new_lead_limit: -1,
        user_nickname: "",
        vdc_agent_api_access: "0",
        vicidial_recording: "1",
        vicidial_recording_override: "DISABLED",
        vicidial_transfers: "1",
        view_reports: "0",
        voicemail_id: null,
        wrapup_seconds_override: -1,
    };

    // Variables pour la gestion de l'interface
    let userId = null;
    let isLoading = true;
    let showSuccess = false;
    let showError = false;
    let errorMessage = "";
    let activeTab = "profile";
    let showPasswordToggle = false;
    let isSaving = false;
    let userGroups = ["test", "admin", "agents", "managers"]; // Exemple de groupes
    let userLevels = [
        { value: 1, label: "1: Standard User" },
        { value: 8, label: "8: Manager" },
        { value: 9, label: "9: Administrator" }
    ];
    let confirmDeleteModal = false;
    let lastLoginDate = "";
    let formChanged = false;
    let originalUser = {};
    let showPasswordField = false;

    // Fonction pour formater la date
    function formatDate(dateString) {
        if (!dateString) return "Never";
        const date = new Date(dateString);
        return date.toLocaleString();
    }

    // Fetch user details based on the userId
    async function fetchUserDetails(id) {
        isLoading = true;
        try {
            const response = await fetchWithAuth(
                `http://localhost:8000/api/admin/user/getUserById/${id}`
            );
            if (response.ok) {
                const data = await response.json();

                if (data.length > 0) {
                    user = { ...user, ...data[0] }; // Merge fetched data into user object
                    originalUser = JSON.parse(JSON.stringify(user)); // Deep copy for comparison
                    
                    // Format the last login date
                    lastLoginDate = formatDate(user.last_login_date);
                }
            } else {
                showError = true;
                errorMessage = "Failed to fetch user details: " + (response.status === 401 ? "Non autorisé" : response.status);
            }
        } catch (error) {
            console.error("Error fetching user details:", error);
            showError = true;
            errorMessage = "Error connecting to server";
        } finally {
            isLoading = false;
        }
    }

    // Update user
    async function updateUser(event) {
        event.preventDefault(); // Prevent default form submission
        isSaving = true;
        showSuccess = false;
        showError = false;

        try {
            const response = await fetchWithAuth(
                `http://localhost:8000/api/admin/user/users/${userId}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(user),
                },
            );

            if (!response.ok) {
                throw new Error("Failed to update user: " + (response.status === 401 ? "Non autorisé" : response.status));
            }

            const result = await response.json();
            showSuccess = true;
            formChanged = false;
            originalUser = JSON.parse(JSON.stringify(user)); // Update original user data
            
            // Scroll to top to show success message
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (error) {
            console.error("Error updating user:", error);
            showError = true;
            errorMessage = error.message || "Failed to update user";
        } finally {
            isSaving = false;
        }
    }

    // Delete user function
    async function deleteUser() {
        isSaving = true;
        try {
            const response = await fetchWithAuth(
                `http://localhost:8000/api/admin/user/users/${userId}`,
                {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                    },
                },
            );

            if (!response.ok) {
                throw new Error("Failed to delete user: " + (response.status === 401 ? "Non autorisé" : response.status));
            }

            // Redirect to users list with success message
            localStorage.setItem('userNotification', JSON.stringify({
                type: 'success',
                message: `L'utilisateur ${user.user} a été supprimé avec succès!`,
                timestamp: new Date().getTime()
            }));
            
            goto("/users/list");
        } catch (error) {
            console.error("Error deleting user:", error);
            showError = true;
            errorMessage = error.message || "Failed to delete user";
            confirmDeleteModal = false;
        } finally {
            isSaving = false;
        }
    }

    // Check if form has been modified
    $: {
        if (!isLoading && Object.keys(originalUser).length > 0) {
            formChanged = JSON.stringify(user) !== JSON.stringify(originalUser);
        }
    }

    // Reset form to original values
    function resetForm() {
        user = JSON.parse(JSON.stringify(originalUser));
        formChanged = false;
    }

    // Toggle password visibility
    function togglePasswordVisibility() {
        showPasswordToggle = !showPasswordToggle;
    }

    // Set active tab
    function setActiveTab(tab) {
        activeTab = tab;
    }

    // Get userId from the URL query parameters
    onMount(() => {
        const urlParams = new URLSearchParams(window.location.search);
        userId = urlParams.get("id");

        if (!userId) {
            console.error("No user ID provided");
            goto("/users/list"); // Navigate back if no ID
        } else {
            fetchUserDetails(userId); // Fetch the user details using the id
        }
        
        // Add confirmation before leaving if form has changed
        window.addEventListener('beforeunload', (e) => {
            if (formChanged) {
                e.preventDefault();
                e.returnValue = '';
            }
        });
    });
</script>

<div class="container py-4">
    <!-- Notifications -->
    {#if showSuccess}
        <div class="alert alert-success alert-dismissible fade show" role="alert" transition:fly={{ y: -20, duration: 300 }}>
            <i class="bi bi-check-circle-fill me-2"></i> Utilisateur mis à jour avec succès!
            <button type="button" class="btn-close" on:click={() => showSuccess = false} aria-label="Close"></button>
        </div>
    {/if}

    {#if showError}
        <div class="alert alert-danger alert-dismissible fade show" role="alert" transition:fly={{ y: -20, duration: 300 }}>
            <i class="bi bi-exclamation-triangle-fill me-2"></i> {errorMessage}
            <button type="button" class="btn-close" on:click={() => showError = false} aria-label="Close"></button>
        </div>
    {/if}

    <!-- Header -->
    <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
            <h1 class="mb-0 fw-bold">
                <i class="bi bi-person-badge me-2"></i>Détails de l'utilisateur
            </h1>
            <p class="text-muted mb-0">{user.user ? user.user : 'Chargement...'}</p>
        </div>
        <div class="d-flex gap-2">
            <a href="/users/list" class="btn btn-outline-secondary">
                <i class="bi bi-arrow-left me-1"></i> Retour
            </a>
            <button type="button" class="btn btn-danger" on:click={() => confirmDeleteModal = true} disabled={isLoading}>
                <i class="bi bi-trash me-1"></i> Supprimer
            </button>
        </div>
    </div>

    {#if isLoading}
        <div class="d-flex justify-content-center align-items-center" style="height: 300px;" in:fade>
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Chargement...</span>
            </div>
        </div>
    {:else}
        <!-- User Info Card -->
        <div class="card shadow-sm mb-4" in:fly={{ y: 20, duration: 400 }}>
            <div class="card-header bg-light d-flex align-items-center p-3">
                <div class="user-avatar me-3 bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style="width: 48px; height: 48px; font-size: 20px;">
                    {user.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                    <h5 class="card-title mb-0">{user.full_name || 'Utilisateur'}</h5>
                    <p class="card-subtitle text-muted mb-0 small">
                        <i class="bi bi-clock-history me-1"></i> Dernière connexion: {lastLoginDate}
                    </p>
                </div>
                <div class="ms-auto">
                    <span class="badge {user.active === 'Y' ? 'bg-success' : 'bg-secondary'}">
                        {user.active === 'Y' ? 'Actif' : 'Inactif'}
                    </span>
                </div>
            </div>

            <!-- Tabs Navigation -->
            <div class="card-header bg-white p-0 border-bottom">
                <ul class="nav nav-tabs card-header-tabs">
                    <li class="nav-item">
                        <button class="nav-link {activeTab === 'profile' ? 'active' : ''}" 
                                on:click={() => setActiveTab('profile')}>
                            <i class="bi bi-person me-1"></i> Profil
                        </button>
                    </li>
                    <li class="nav-item">
                        <button class="nav-link {activeTab === 'security' ? 'active' : ''}" 
                                on:click={() => setActiveTab('security')}>
                            <i class="bi bi-shield-lock me-1"></i> Sécurité
                        </button>
                    </li>
                    <li class="nav-item">
                        <button class="nav-link {activeTab === 'permissions' ? 'active' : ''}" 
                                on:click={() => setActiveTab('permissions')}>
                            <i class="bi bi-key me-1"></i> Permissions
                        </button>
                    </li>
                    <li class="nav-item">
                        <button class="nav-link {activeTab === 'activity' ? 'active' : ''}" 
                                on:click={() => setActiveTab('activity')}>
                            <i class="bi bi-activity me-1"></i> Activité
                        </button>
                    </li>
                </ul>
            </div>

            <div class="card-body p-4">
                <form on:submit={updateUser}>
                    <!-- Profile Tab -->
                    {#if activeTab === 'profile'}
                        <div transition:fade={{ duration: 200 }}>
                            <div class="row g-3 mb-4">
                                <div class="col-md-6">
                                    <label for="user" class="form-label">Nom d'utilisateur</label>
                                    <div class="input-group">
                                        <span class="input-group-text"><i class="bi bi-person"></i></span>
                                        <input type="text" class="form-control" id="user" 
                                            bind:value={user.user} placeholder="Nom d'utilisateur" required>
                                    </div>
                                </div>
                                
                                <div class="col-md-6">
                                    <label for="full_name" class="form-label">Nom complet</label>
                                    <div class="input-group">
                                        <span class="input-group-text"><i class="bi bi-person-vcard"></i></span>
                                        <input type="text" class="form-control" id="full_name" 
                                            bind:value={user.full_name} placeholder="Nom complet" required>
                                    </div>
                                </div>
                                
                                <div class="col-md-6">
                                    <label for="email" class="form-label">Email</label>
                                    <div class="input-group">
                                        <span class="input-group-text"><i class="bi bi-envelope"></i></span>
                                        <input type="email" class="form-control" id="email" 
                                            bind:value={user.email} placeholder="Email">
                                    </div>
                                </div>
                                
                                <div class="col-md-6">
                                    <label for="mobile_number" class="form-label">Numéro de téléphone</label>
                                    <div class="input-group">
                                        <span class="input-group-text"><i class="bi bi-phone"></i></span>
                                        <input type="tel" class="form-control" id="mobile_number" 
                                            bind:value={user.mobile_number} placeholder="Numéro de téléphone">
                                    </div>
                                </div>
                                
                                <div class="col-md-6">
                                    <label for="user_group" class="form-label">Groupe d'utilisateurs</label>
                                    <div class="input-group">
                                        <span class="input-group-text"><i class="bi bi-people"></i></span>
                                        <select class="form-select" id="user_group" bind:value={user.user_group}>
                                            {#each userGroups as group}
                                                <option value={group}>{group}</option>
                                            {/each}
                                        </select>
                                    </div>
                                </div>
                                
                                <div class="col-md-6">
                                    <label for="user_level" class="form-label">Niveau d'utilisateur</label>
                                    <div class="input-group">
                                        <span class="input-group-text"><i class="bi bi-layers"></i></span>
                                        <select class="form-select" id="user_level" bind:value={user.user_level}>
                                            {#each userLevels as level}
                                                <option value={level.value}>{level.label}</option>
                                            {/each}
                                        </select>
                                    </div>
                                </div>
                                
                                <div class="col-md-6">
                                    <label for="active" class="form-label">Statut du compte</label>
                                    <div class="input-group">
                                        <span class="input-group-text"><i class="bi bi-toggle-on"></i></span>
                                        <select class="form-select" id="active" bind:value={user.active}>
                                            <option value="Y">Actif</option>
                                            <option value="N">Inactif</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div class="col-md-6">
                                    <label for="user_code" class="form-label">Code utilisateur</label>
                                    <div class="input-group">
                                        <span class="input-group-text"><i class="bi bi-hash"></i></span>
                                        <input type="text" class="form-control" id="user_code" 
                                            bind:value={user.user_code} placeholder="Code utilisateur">
                                    </div>
                                </div>
                            </div>
                        </div>
                    {/if}

                    <!-- Security Tab -->
                    {#if activeTab === 'security'}
                        <div transition:fade={{ duration: 200 }}>
                            <div class="row g-3 mb-4">
                                <div class="col-md-6">
                                    <label for="pass" class="form-label">Mot de passe</label>
                                    <div class="input-group">
                                        <span class="input-group-text"><i class="bi bi-key"></i></span>
                                        {#if showPasswordToggle}
                                            <input type="text" class="form-control" id="pass" 
                                                bind:value={user.pass} placeholder="Laisser vide pour ne pas changer">
                                        {:else}
                                            <input type="password" class="form-control" id="pass" 
                                                bind:value={user.pass} placeholder="Laisser vide pour ne pas changer">
                                        {/if}
                                        <button class="btn btn-outline-secondary" type="button" on:click={togglePasswordVisibility}>
                                            <i class="bi {showPasswordToggle ? 'bi-eye-slash' : 'bi-eye'}"></i>
                                        </button>
                                    </div>
                                    <div class="form-text">Laissez vide pour conserver le mot de passe actuel</div>
                                </div>
                                
                                <div class="col-md-6">
                                    <label for="force_change_password" class="form-label">Forcer le changement de mot de passe</label>
                                    <div class="input-group">
                                        <span class="input-group-text"><i class="bi bi-shield-exclamation"></i></span>
                                        <select class="form-select" id="force_change_password" bind:value={user.force_change_password}>
                                            <option value="N">Non</option>
                                            <option value="Y">Oui</option>
                                        </select>
                                    </div>
                                    <div class="form-text">L'utilisateur devra changer son mot de passe à la prochaine connexion</div>
                                </div>
                                
                                <div class="col-md-6">
                                    <label for="phone_login" class="form-label">Identifiant téléphonique</label>
                                    <div class="input-group">
                                        <span class="input-group-text"><i class="bi bi-telephone"></i></span>
                                        <input type="text" class="form-control" id="phone_login" 
                                            bind:value={user.phone_login} placeholder="Identifiant téléphonique">
                                    </div>
                                </div>
                                
                                <div class="col-md-6">
                                    <label for="phone_pass" class="form-label">Mot de passe téléphonique</label>
                                    <div class="input-group">
                                        <span class="input-group-text"><i class="bi bi-telephone-plus"></i></span>
                                        <input type="text" class="form-control" id="phone_pass" 
                                            bind:value={user.phone_pass} placeholder="Mot de passe téléphonique">
                                    </div>
                                </div>
                            </div>
                            
                            <div class="alert alert-info" role="alert">
                                <i class="bi bi-info-circle-fill me-2"></i>
                                <strong>Informations de sécurité</strong>
                                <ul class="mb-0 mt-2">
                                    <li>Dernière connexion: {lastLoginDate}</li>
                                    <li>Dernière IP: {user.last_ip || 'Inconnue'}</li>
                                    <li>Tentatives de connexion échouées: {user.failed_login_count || 0}</li>
                                </ul>
                            </div>
                        </div>
                    {/if}

                    <!-- Permissions Tab -->
                    {#if activeTab === 'permissions'}
                        <div transition:fade={{ duration: 200 }}>
                            <div class="row g-3 mb-4">
                                <div class="col-md-6">
                                    <label for="agentonly_callbacks" class="form-label">Rappels agent uniquement</label>
                                    <div class="input-group">
                                        <span class="input-group-text"><i class="bi bi-telephone-forward"></i></span>
                                        <select class="form-select" id="agentonly_callbacks" bind:value={user.agentonly_callbacks}>
                                            <option value="0">Désactivé</option>
                                            <option value="1">Activé</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div class="col-md-6">
                                    <label for="agentcall_manual" class="form-label">Appel manuel agent</label>
                                    <div class="input-group">
                                        <span class="input-group-text"><i class="bi bi-telephone-outbound"></i></span>
                                        <select class="form-select" id="agentcall_manual" bind:value={user.agentcall_manual}>
                                            <option value="0">Désactivé</option>
                                            <option value="1">Activé</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div class="col-md-6">
                                    <label for="scheduled_callbacks" class="form-label">Rappels programmés</label>
                                    <div class="input-group">
                                        <span class="input-group-text"><i class="bi bi-calendar-check"></i></span>
                                        <select class="form-select" id="scheduled_callbacks" bind:value={user.scheduled_callbacks}>
                                            <option value="0">Désactivé</option>
                                            <option value="1">Activé</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div class="col-md-6">
                                    <label for="vicidial_recording" class="form-label">Enregistrement d'appels</label>
                                    <div class="input-group">
                                        <span class="input-group-text"><i class="bi bi-record-circle"></i></span>
                                        <select class="form-select" id="vicidial_recording" bind:value={user.vicidial_recording}>
                                            <option value="0">Désactivé</option>
                                            <option value="1">Activé</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="card mb-4">
                                <div class="card-header bg-light">
                                    <h5 class="mb-0">Permissions avancées</h5>
                                </div>
                                <div class="card-body">
                                    <div class="row g-3">
                                        <div class="col-md-4">
                                            <div class="form-check form-switch">
                                                <input class="form-check-input" type="checkbox" id="modify_users"
                                                    checked={user.modify_users === '1'} 
                                                    on:change={() => user.modify_users = user.modify_users === '1' ? '0' : '1'}>
                                                <label class="form-check-label" for="modify_users">Modifier les utilisateurs</label>
                                            </div>
                                        </div>
                                        
                                        <div class="col-md-4">
                                            <div class="form-check form-switch">
                                                <input class="form-check-input" type="checkbox" id="modify_campaigns"
                                                    checked={user.modify_campaigns === '1'} 
                                                    on:change={() => user.modify_campaigns = user.modify_campaigns === '1' ? '0' : '1'}>
                                                <label class="form-check-label" for="modify_campaigns">Modifier les campagnes</label>
                                            </div>
                                        </div>
                                        
                                        <div class="col-md-4">
                                            <div class="form-check form-switch">
                                                <input class="form-check-input" type="checkbox" id="modify_lists"
                                                    checked={user.modify_lists === '1'} 
                                                    on:change={() => user.modify_lists = user.modify_lists === '1' ? '0' : '1'}>
                                                <label class="form-check-label" for="modify_lists">Modifier les listes</label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    {/if}

                    <!-- Activity Tab -->
                    {#if activeTab === 'activity'}
                        <div transition:fade={{ duration: 200 }}>
                            <div class="alert alert-light border mb-4">
                                <h5><i class="bi bi-info-circle me-2"></i>Informations d'activité</h5>
                                <p class="mb-0">Cette section affiche les informations d'activité de l'utilisateur.</p>
                            </div>
                            
                            <div class="row g-4">
                                <div class="col-md-6">
                                    <div class="card h-100">
                                        <div class="card-header bg-light">
                                            <h6 class="mb-0">Informations de connexion</h6>
                                        </div>
                                        <div class="card-body">
                                            <ul class="list-group list-group-flush">
                                                <li class="list-group-item d-flex justify-content-between align-items-center">
                                                    <span><i class="bi bi-calendar me-2"></i>Dernière connexion</span>
                                                    <span class="badge bg-secondary rounded-pill">{lastLoginDate}</span>
                                                </li>
                                                <li class="list-group-item d-flex justify-content-between align-items-center">
                                                    <span><i class="bi bi-globe me-2"></i>Dernière IP</span>
                                                    <span class="badge bg-secondary rounded-pill">{user.last_ip || 'Inconnue'}</span>
                                                </li>
                                                <li class="list-group-item d-flex justify-content-between align-items-center">
                                                    <span><i class="bi bi-exclamation-triangle me-2"></i>Tentatives échouées</span>
                                                    <span class="badge bg-secondary rounded-pill">{user.failed_login_count || 0}</span>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="col-md-6">
                                    <div class="card h-100">
                                        <div class="card-header bg-light">
                                            <h6 class="mb-0">Statistiques d'appels</h6>
                                        </div>
                                        <div class="card-body">
                                            <div class="text-center py-4">
                                                <i class="bi bi-bar-chart-line fs-1 text-primary"></i>
                                                <p class="mt-3">Les statistiques d'appels seront disponibles prochainement.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    {/if}

                    <!-- Form Actions -->
                    <div class="d-flex justify-content-between mt-4 pt-3 border-top">
                        <div>
                            <button type="button" class="btn btn-outline-secondary me-2" on:click={resetForm} disabled={!formChanged || isSaving}>
                                <i class="bi bi-arrow-counterclockwise me-1"></i> Réinitialiser
                            </button>
                        </div>
                        <div>
                            <button type="submit" class="btn btn-primary" disabled={!formChanged || isSaving}>
                                {#if isSaving}
                                    <span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                    Enregistrement...
                                {:else}
                                    <i class="bi bi-check-circle me-1"></i> Enregistrer les modifications
                                {/if}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    {/if}
</div>

<!-- Delete Confirmation Modal -->
{#if confirmDeleteModal}
    <div class="modal fade show" style="display: block; background-color: rgba(0,0,0,0.5);" tabindex="-1" aria-modal="true" role="dialog">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content" in:fly={{ y: 20, duration: 300 }}>
                <div class="modal-header bg-danger text-white">
                    <h5 class="modal-title"><i class="bi bi-exclamation-triangle me-2"></i>Confirmation de suppression</h5>
                    <button type="button" class="btn-close btn-close-white" on:click={() => confirmDeleteModal = false}></button>
                </div>
                <div class="modal-body">
                    <p>Êtes-vous sûr de vouloir supprimer l'utilisateur <strong>{user.user}</strong> ?</p>
                    <p class="text-danger"><strong>Attention :</strong> Cette action est irréversible.</p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" on:click={() => confirmDeleteModal = false}>
                        <i class="bi bi-x-circle me-1"></i> Annuler
                    </button>
                    <button type="button" class="btn btn-danger" on:click={deleteUser} disabled={isSaving}>
                        {#if isSaving}
                            <span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                            Suppression...
                        {:else}
                            <i class="bi bi-trash me-1"></i> Supprimer définitivement
                        {/if}
                    </button>
                </div>
            </div>
        </div>
    </div>
{/if}

<style>
    /* Styles spécifiques à la page de détail utilisateur */
    .user-avatar {
        transition: transform 0.3s ease;
    }
    
    .user-avatar:hover {
        transform: scale(1.1);
    }
    
    .card {
        transition: box-shadow 0.3s ease, transform 0.3s ease;
        border: none;
        overflow: hidden;
    }
    
    .card:hover {
        box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
    }
    
    .nav-tabs .nav-link {
        color: #6c757d;
        border: none;
        padding: 1rem 1.5rem;
        font-weight: 500;
        transition: all 0.2s ease;
        border-bottom: 3px solid transparent;
    }
    
    .nav-tabs .nav-link:hover {
        color: #495057;
        background-color: rgba(0, 0, 0, 0.02);
    }
    
    .nav-tabs .nav-link.active {
        color: #4a6bff;
        background-color: transparent;
        border-bottom: 3px solid #4a6bff;
    }
    
    .form-control, .form-select, .input-group-text {
        padding: 0.6rem 1rem;
        border-radius: 0.5rem;
    }
    
    .input-group-text {
        background-color: #f8f9fa;
        border-color: #ced4da;
    }
    
    .input-group .form-control {
        border-left: 0;
    }
    
    .form-control:focus, .form-select:focus {
        border-color: #4a6bff;
        box-shadow: 0 0 0 0.25rem rgba(74, 107, 255, 0.15);
    }
    
    .form-label {
        font-weight: 500;
        font-size: 0.9rem;
        color: #495057;
        margin-bottom: 0.5rem;
    }
    
    .form-text {
        color: #6c757d;
        font-size: 0.8rem;
        margin-top: 0.25rem;
    }
    
    .btn {
        border-radius: 0.5rem;
        padding: 0.6rem 1.25rem;
        font-weight: 500;
        transition: all 0.2s ease;
    }
    
    .btn-primary {
        background: linear-gradient(135deg, #4a6bff, #2541b2);
        border: none;
    }
    
    .btn-primary:hover:not(:disabled) {
        background: linear-gradient(135deg, #3a5bef, #1531a2);
        transform: translateY(-2px);
    }
    
    .btn-primary:disabled {
        background: linear-gradient(135deg, #a0afd7, #8c9ac1);
    }
    
    .btn-danger {
        background: linear-gradient(135deg, #ff4a4a, #b22525);
        border: none;
    }
    
    .btn-danger:hover:not(:disabled) {
        background: linear-gradient(135deg, #ef3a3a, #a21515);
        transform: translateY(-2px);
    }
    
    .form-check-input:checked {
        background-color: #4a6bff;
        border-color: #4a6bff;
    }
    
    .list-group-item {
        padding: 1rem 1.25rem;
        transition: background-color 0.2s ease;
    }
    
    .list-group-item:hover {
        background-color: #f8f9fa;
    }
    
    /* Animation pour les transitions entre onglets */
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    /* Modal styles */
    .modal-content {
        border: none;
        border-radius: 0.75rem;
        overflow: hidden;
    }
    
    .modal-header {
        border-bottom: none;
        padding: 1.5rem;
    }
    
    .modal-footer {
        border-top: none;
        padding: 1.25rem 1.5rem;
    }
    
    /* Responsive adjustments */
    @media (max-width: 768px) {
        .nav-tabs .nav-link {
            padding: 0.75rem 1rem;
            font-size: 0.9rem;
        }
        
        .card-body {
            padding: 1.25rem;
        }
    }
</style>
