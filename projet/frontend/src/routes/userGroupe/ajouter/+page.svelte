<script>
    import { onMount } from 'svelte';
    import { writable } from 'svelte/store';
    import { fade, fly } from 'svelte/transition';
    import { quintOut } from 'svelte/easing';
    import { goto } from '$app/navigation';

    const errorStore = writable(null);
    let error;
    $: error = $errorStore;

    let isSubmitting = false;
    let showSuccessMessage = false;
    let apiBaseUrl = 'http://localhost:8000/api/admin';
    let redirectTimer = null;

    // Add Font Awesome
    let fontAwesomeLoaded = false;

    function loadFontAwesome() {
      if (fontAwesomeLoaded) return;
      
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css';
      link.integrity = 'sha512-1ycn6IcaQQ40/MKBW2W4Rhis/DbILU74C1vSrLJxCq57o941Ym01SwNsOMqvEBFlcgUa6xLiPY/NS5R+E6ztJQ==';
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
      
      fontAwesomeLoaded = true;
    }

    // Model for new user group with default values
    let newUserGroup = {
        user_group: '', // Identifier/Description
        group_name: '', // Group name
        allowed_campaigns: '-ALL-',
        qc_allowed_campaigns: '',
        qc_allowed_inbound_groups: '',
        group_shifts: '',
        forced_timeclock_login: 'N',
        shift_enforcement: 'OFF',
        agent_status_viewable_groups: '-ALL-',
        agent_status_view_time: 'N',
        agent_call_log_view: 'N',
        agent_xfer_consultative: 'Y',
        agent_xfer_dial_override: 'Y',
        agent_xfer_vm_transfer: 'Y',
        agent_xfer_blind_transfer: 'Y',
        agent_xfer_dial_with_customer: 'Y',
        agent_xfer_park_customer_dial: 'Y',
        agent_fullscreen: 'N',
        allowed_reports: '-ALL-',
        webphone_url_override: '',
        webphone_systemkey_override: '',
        webphone_dialpad_override: 'DISABLED',
        admin_viewable_groups: '-ALL-',
        admin_viewable_call_times: '-ALL-',
        allowed_custom_reports: '-ALL-',
        agent_allowed_chat_groups: '-ALL-',
        agent_xfer_park_3way: 'Y',
        admin_ip_list: '',
        agent_ip_list: '',
        api_ip_list: '',
        webphone_layout: '',
        allowed_queue_groups: '',
        reports_header_override: 'DISABLED',
        admin_home_url: '',
        script_id: '',
    };

    // Reactive variable to check if the form is valid
    let isValid;
    $: isValid = newUserGroup.user_group && newUserGroup.user_group.trim() !== '' && 
                 newUserGroup.group_name && newUserGroup.group_name.trim() !== '';

    // Function to reset the form
    function resetForm() {
        newUserGroup = {
            user_group: '',
            group_name: '',
            allowed_campaigns: '-ALL-',
            qc_allowed_campaigns: '',
            qc_allowed_inbound_groups: '',
            group_shifts: '',
            forced_timeclock_login: 'N',
            shift_enforcement: 'OFF',
            agent_status_viewable_groups: '-ALL-',
            agent_status_view_time: 'N',
            agent_call_log_view: 'N',
            agent_xfer_consultative: 'Y',
            agent_xfer_dial_override: 'Y',
            agent_xfer_vm_transfer: 'Y',
            agent_xfer_blind_transfer: 'Y',
            agent_xfer_dial_with_customer: 'Y',
            agent_xfer_park_customer_dial: 'Y',
            agent_fullscreen: 'N',
            allowed_reports: '-ALL-',
            webphone_url_override: '',
            webphone_systemkey_override: '',
            webphone_dialpad_override: 'DISABLED',
            admin_viewable_groups: '-ALL-',
            admin_viewable_call_times: '-ALL-',
            allowed_custom_reports: '-ALL-',
            agent_allowed_chat_groups: '-ALL-',
            agent_xfer_park_3way: 'Y',
            admin_ip_list: '',
            agent_ip_list: '',
            api_ip_list: '',
            webphone_layout: '',
            allowed_queue_groups: '',
            reports_header_override: 'DISABLED',
            admin_home_url: '',
            script_id: '',
        };
    }

    // Function to submit the form
    async function submitForm() {
        try {
            isSubmitting = true;
            errorStore.set(null);
            showSuccessMessage = false;

            console.log("Submitting form with data:", JSON.stringify(newUserGroup));

            const response = await fetch(`${apiBaseUrl}/usergroup/createUserGroup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(newUserGroup)
            });

            console.log("Response received:", response.status);

            let data;
            try {
                data = await response.json();
                console.log("Data received:", data);
            } catch (e) {
                console.error("Error reading JSON response:", e);
                data = { message: "Error reading response" };
            }

            if (!response.ok) {
                throw new Error(data.message || `Error ${response.status}: ${response.statusText}`);
            }

            // Show success message
            showSuccessMessage = true;
            resetForm();
            
            // Set redirect timer to go back to the list page
            redirectTimer = setTimeout(() => {
                goto('/userGroupe/afficher');
            }, 2000);

        } catch (err) {
            console.error('Error creating user group:', err);
            errorStore.set(err.message || 'Unable to create user group. Please try again later.');
        } finally {
            isSubmitting = false;
        }
    }

    // Cancel any pending redirects when component is destroyed
    onMount(() => {
        loadFontAwesome();
        return () => {
            if (redirectTimer) clearTimeout(redirectTimer);
        };
    });

    // Function to go back to the list page
    function goBack() {
        goto('/userGroupe/afficher');
    }
</script>

<div class="user-group-form-container">
    <header class="page-header">
        <div class="header-content">
            <h1 class="header-title">
                <i class="fas fa-users-cog"></i> Ajouter un Groupe d'Utilisateurs
            </h1>
            <div class="header-actions">
                <button class="btn btn-secondary" on:click={goBack}>
                    <i class="fas fa-arrow-left"></i> Retour à la liste
                </button>
            </div>
        </div>
    </header>

    <!-- Error Notification -->
    {#if error}
        <div 
            class="notification notification-error" 
            transition:fly={{ y: -20, duration: 300, easing: quintOut }}
            role="alert"
        >
            <div class="notification-icon">
                <i class="fas fa-exclamation-triangle"></i>
            </div>
            <div class="notification-content">
                {error}
            </div>
            <button class="notification-close" on:click={() => errorStore.set(null)} aria-label="Close" name="close-notification" id="close-notification">
                <i class="fas fa-times"></i>
            </button>
        </div>
    {/if}

    <!-- Success Notification -->
    {#if showSuccessMessage}
        <div 
            class="notification notification-success" 
            transition:fly={{ y: -20, duration: 300, easing: quintOut }}
            role="alert"
        >
            <div class="notification-icon">
                <i class="fas fa-check-circle"></i>
            </div>
            <div class="notification-content">
                <p>Groupe d'utilisateurs créé avec succès!</p>
                <p class="notification-redirect">Redirection vers la liste des groupes...</p>
            </div>
            <button class="notification-close" on:click={() => showSuccessMessage = false} aria-label="Close" name="close-success" id="close-success">
                <i class="fas fa-times"></i>
            </button>
        </div>
    {/if}

    <div class="card">
        <div class="card-header">
            <div class="card-title">
                <i class="fas fa-plus-circle"></i>
                <span>Nouveau Groupe d'Utilisateurs</span>
            </div>
        </div>
        <div class="card-body">
            <form id="addUserGroupForm" on:submit|preventDefault={submitForm} name="addUserGroupForm">
                
                <div class="form-simple">
                    <div class="form-group">
                        <label for="group_name" class="form-label">Nom du Groupe <span class="required">*</span></label>
                        <input 
                            type="text" 
                            class="form-input" 
                            id="group_name" 
                            name="group_name"
                            bind:value={newUserGroup.group_name}
                            maxlength="40"
                            placeholder="Entrez le nom du groupe"
                            required
                        />
                        <div class="form-hint">Nom descriptif pour le groupe (max 40 caractères)</div>
                    </div>
                    
                    <div class="form-group">
                        <label for="user_group" class="form-label">Identifiant <span class="required">*</span></label>
                        <input 
                            type="text" 
                            class="form-input" 
                            id="user_group" 
                            name="user_group"
                            bind:value={newUserGroup.user_group}
                            maxlength="20"
                            placeholder="Entrez l'identifiant du groupe"
                            required
                        />
                        <div class="form-hint">Identifiant unique pour le groupe (max 20 caractères)</div>
                    </div>
                </div>
                
                <div class="form-actions">
                    <button 
                        type="button" 
                        class="btn btn-outline" 
                        on:click={goBack}
                        disabled={isSubmitting}
                    >
                        <i class="fas fa-times"></i>
                        <span>Annuler</span>
                    </button>
                    
                    <button 
                        type="button" 
                        class="btn btn-secondary" 
                        on:click={resetForm}
                        disabled={isSubmitting}
                        id="reset-form"
                        name="reset-form"
                    >
                        <i class="fas fa-redo"></i>
                        <span>Réinitialiser</span>
                    </button>
                    
                    <button 
                        type="submit"
                        class="btn btn-primary" 
                        disabled={isSubmitting || !isValid}
                        id="submit-form"
                        name="submit-form"
                    >
                        {#if isSubmitting}
                            <span class="spinner"></span>
                            <span>Traitement...</span>
                        {:else}
                            <i class="fas fa-save"></i>
                            <span>Créer le Groupe</span>
                        {/if}
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>

<style>
    /* Base styles */
    :global(body) {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        background-color: #f8f9fa;
        color: #333;
        line-height: 1.6;
    }

    .user-group-form-container {
        width: 100%;
        max-width: 1000px;
        margin: 0 auto;
        padding: 2rem;
        position: relative;
    }

    /* Header styles */
    .page-header {
        margin-bottom: 2rem;
    }

    .header-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 1rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid #e9ecef;
    }

    .header-title {
        font-size: 2rem;
        font-weight: 600;
        color: #2563eb;
        margin: 0;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .header-actions {
        display: flex;
        gap: 0.75rem;
        flex-wrap: wrap;
    }

    /* Card styles */
    .card {
        background-color: white;
        border-radius: 0.5rem;
        box-shadow: 0 4px 15px -3px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
        overflow: hidden;
        transition: box-shadow 0.3s ease;
        margin-bottom: 2rem;
    }

    .card:hover {
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
    }

    .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.25rem 1.5rem;
        background-color: #f9fafb;
        border-bottom: 1px solid #e5e7eb;
    }

    .card-title {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-weight: 600;
        font-size: 1.25rem;
        color: #1f2937;
    }

    .card-body {
        padding: 1.5rem;
    }

    /* Form styles */
    .form-simple {
        max-width: 600px;
        margin: 0 auto;
    }

    .form-group {
        margin-bottom: 1.5rem;
    }

    .form-label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
        color: #4b5563;
    }

    .required {
        color: #ef4444;
        margin-left: 0.25rem;
    }

    .form-input,
    .form-select {
        width: 100%;
        padding: 0.75rem 1rem;
        border: 1px solid #d1d5db;
        border-radius: 0.375rem;
        font-size: 1rem;
        transition: border-color 0.2s, box-shadow 0.2s;
        background-color: white;
    }

    .form-input:focus,
    .form-select:focus {
        outline: none;
        border-color: #2563eb;
        box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }

    .form-hint {
        margin-top: 0.5rem;
        font-size: 0.875rem;
        color: #6b7280;
    }

    .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
        margin-top: 2rem;
        padding-top: 1.5rem;
        border-top: 1px solid #e5e7eb;
    }

    /* Button styles */
    .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0.75rem 1.5rem;
        border-radius: 0.375rem;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        border: none;
        font-size: 0.875rem;
        gap: 0.5rem;
    }

    .btn-primary {
        background-color: #2563eb;
        color: white;
    }

    .btn-primary:hover {
        background-color: #1d4ed8;
        transform: translateY(-1px);
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    }

    .btn-primary:disabled {
        background-color: #93c5fd;
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
    }

    .btn-secondary {
        background-color: #6b7280;
        color: white;
    }

    .btn-secondary:hover {
        background-color: #4b5563;
        transform: translateY(-1px);
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    }

    .btn-outline {
        background-color: transparent;
        border: 1px solid #d1d5db;
        color: #4b5563;
    }

    .btn-outline:hover {
        background-color: #f3f4f6;
        border-color: #9ca3af;
        color: #1f2937;
    }

    /* Notification styles */
    .notification {
        position: fixed;
        top: 1rem;
        right: 1rem;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 1rem;
        border-radius: 0.375rem;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        max-width: 400px;
        z-index: 1100;
        animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }

    .notification-success {
        background-color: #dcfce7;
        color: #15803d;
        border-left: 4px solid #10b981;
    }

    .notification-error {
        background-color: #fee2e2;
        color: #b91c1c;
        border-left: 4px solid #ef4444;
    }

    .notification-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        font-size: 1.25rem;
    }

    .notification-content {
        flex: 1;
    }

    .notification-content p {
        margin: 0;
    }

    .notification-redirect {
        font-size: 0.875rem;
        margin-top: 0.5rem !important;
        opacity: 0.8;
        font-style: italic;
    }

    .notification-close {
        display: flex;
        align-items: center;
        justify-content: center;
        background: none;
        border: none;
        color: currentColor;
        opacity: 0.7;
        cursor: pointer;
    }

    .notification-close:hover {
        opacity: 1;
    }

    /* Spinner */
    .spinner {
        width: 1rem;
        height: 1rem;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top: 2px solid white;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }

    /* Responsive adjustments */
    @media (max-width: 768px) {
        .user-group-form-container {
            padding: 1rem;
        }
        
        .header-content {
            flex-direction: column;
            align-items: flex-start;
        }
    }

    @media (max-width: 640px) {
        .form-actions {
            flex-direction: column;
        }

        .btn {
            width: 100%;
        }
    }
</style>