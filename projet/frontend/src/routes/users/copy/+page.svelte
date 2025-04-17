<script>
    import { fetchWithAuth } from '$lib/utils/fetchWithAuth.js';
    let NewUserNumber = '';
    let password = '';
    let fullName = '';
    let sourceUser = '';
    let errorMessage = '';
    let successMessage = '';
    let data = []; 
    let loading = false;
    let showPassword = false;
    let passwordStrength = { text: 'Aucun', percentage: 0, color: '#e2e8f0' };
  
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { fade, fly } from 'svelte/transition';

    const handleSubmit = async () => {
        if (!NewUserNumber || !password || !fullName || !sourceUser) {
            errorMessage = 'Veuillez remplir tous les champs.';
            return;
        }
        if (password.length < 8) {
            errorMessage = 'Le mot de passe doit contenir au moins 8 caractères.';
            return;
        }
        
        errorMessage = '';
        loading = true;
        
        // Prepare data for the API request
        const userData = {
            user: NewUserNumber,
            pass: password,
            full_name: fullName,
            userID: sourceUser
        };

        try {
            const response = await fetchWithAuth('http://localhost:8000/api/admin/user/copyUser', {
                method: 'POST',
                body: JSON.stringify(userData),
            });

            loading = false;

            if (!response.ok) {
                const errorData = await response.json();
                errorMessage = errorData.message || 'Échec de la copie de l\'utilisateur.';
                return;
            }

            successMessage = 'Utilisateur copié avec succès!';
            
            // Reset the form
            NewUserNumber = '';
            password = '';
            fullName = '';
            sourceUser = '';

            // Navigate after a short delay to show success message
            setTimeout(() => {
                goto('/users/list');
            }, 1500);
        } catch (error) {
            loading = false;
            errorMessage = 'Une erreur est survenue: ' + error.message;
        }
    };
  
    const getUser = async () => {
        try {
            loading = true;
            const response = await fetchWithAuth('http://localhost:8000/api/admin/user/allUsers');
            loading = false;
            
            if (!response.ok) {
                errorMessage = 'Échec de la récupération des données utilisateur.';
                return;
            }
            
            const fetchedData = await response.json();
            data = fetchedData;
        } catch (error) {
            loading = false;
            errorMessage = 'Erreur lors de la récupération des utilisateurs: ' + error.message;
        }
    };
  
    const getPasswordStrength = () => {
        if (password.length === 0) return { text: 'Aucun', percentage: 0, color: '#e2e8f0' };
        if (password.length < 4) return { text: 'Faible', percentage: 25, color: '#f87171' };
        if (password.length < 8) return { text: 'Moyen', percentage: 50, color: '#fbbf24' };
        if (password.length < 12) return { text: 'Fort', percentage: 75, color: '#34d399' };
        return { text: 'Très fort', percentage: 100, color: '#10b981' };
    };

    const togglePasswordVisibility = () => {
        showPassword = !showPassword;
    };
  
    onMount(() => {
        getUser(); 
    });

    $: passwordStrength = getPasswordStrength();
</script>

<div class="page-container">
    <div class="card">
        <div class="card-header">
            <h2>Copier un utilisateur</h2>
            <p class="subtitle">Créez un nouvel utilisateur en copiant les permissions d'un utilisateur existant</p>
        </div>

        <div class="card-body">
            {#if errorMessage}
                <div class="message error" transition:fade={{ duration: 200 }}>
                    <span class="icon">⚠️</span>
                    <span>{errorMessage}</span>
                </div>
            {/if}

            {#if successMessage}
                <div class="message success" transition:fade={{ duration: 200 }}>
                    <span class="icon">✓</span>
                    <span>{successMessage}</span>
                </div>
            {/if}

            <form on:submit|preventDefault={handleSubmit}>
                <div class="form-grid">
                    <div class="form-group">
                        <label for="newUserNumber">
                            <span class="label-text">Nouveau numéro d'utilisateur</span>
                            <span class="required">*</span>
                        </label>
                        <input 
                            type="text" 
                            id="newUserNumber"
                            bind:value={NewUserNumber} 
                            placeholder="Entrez le numéro d'utilisateur"
                            required
                        />
                    </div>

                    <div class="form-group">
                        <label for="fullName">
                            <span class="label-text">Nom complet</span>
                            <span class="required">*</span>
                        </label>
                        <input 
                            type="text" 
                            id="fullName"
                            bind:value={fullName} 
                            placeholder="Entrez le nom complet"
                            required
                        />
                    </div>

                    <div class="form-group password-group">
                        <label for="password">
                            <span class="label-text">Mot de passe</span>
                            <span class="required">*</span>
                        </label>
                        <div class="password-input-wrapper">
                            {#if showPassword}
                                <input 
                                    type="text"
                                    id="password-text" 
                                    bind:value={password} 
                                    placeholder="Entrez le mot de passe"
                                    required
                                />
                            {:else}
                                <input 
                                    type="password"
                                    id="password" 
                                    bind:value={password} 
                                    placeholder="Entrez le mot de passe"
                                    required
                                />
                            {/if}
                            <button 
                                type="button" 
                                class="toggle-password" 
                                on:click={togglePasswordVisibility}
                                aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                            >
                                {showPassword ? '👁️' : '👁️‍🗨️'}
                            </button>
                        </div>
                        <div class="password-strength-container">
                            <div class="password-strength-bar">
                                <div 
                                    class="password-strength-progress" 
                                    style="width: {passwordStrength.percentage}%; background-color: {passwordStrength.color};"
                                ></div>
                            </div>
                            <div class="password-strength-text">
                                Force: <span style="color: {passwordStrength.color};">{passwordStrength.text}</span>
                            </div>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="sourceUser">
                            <span class="label-text">Utilisateur source</span>
                            <span class="required">*</span>
                        </label>
                        <div class="select-wrapper">
                            <select id="sourceUser" bind:value={sourceUser} required>
                                <option value="" disabled>Sélectionnez l'utilisateur source</option>
                                {#each data as user}
                                    <option value={user.user_id}>{user.full_name}</option>
                                {/each}
                            </select>
                            <div class="select-arrow">▼</div>
                        </div>
                    </div>
                </div>

                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" on:click={() => goto('/users/list')}>
                        Annuler
                    </button>
                    <button type="submit" class="btn btn-primary" disabled={loading}>
                        {#if loading}
                            <span class="loader"></span>
                            <span>Traitement...</span>
                        {:else}
                            <span>Copier l'utilisateur</span>
                        {/if}
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>

<style>
    /* Variables */
    :root {
        --primary: #4f46e5;
        --primary-hover: #4338ca;
        --secondary: #f3f4f6;
        --secondary-hover: #e5e7eb;
        --success: #10b981;
        --error: #ef4444;
        --text-primary: #1f2937;
        --text-secondary: #6b7280;
        --border: #d1d5db;
        --card-bg: #ffffff;
        --bg: #f9fafb;
        --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        --radius: 0.5rem;
        --transition: all 0.2s ease;
    }

    /* Global Styles */
    .page-container {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        color: var(--text-primary);
        background-color: var(--bg);
        padding: 2rem;
        min-height: 100vh;
        display: flex;
        justify-content: center;
        align-items: flex-start;
    }

    /* Card Styles */
    .card {
        background-color: var(--card-bg);
        border-radius: var(--radius);
        box-shadow: var(--shadow);
        width: 100%;
        max-width: 800px;
        overflow: hidden;
    }

    .card-header {
        padding: 1.5rem 2rem;
        border-bottom: 1px solid var(--border);
        background-color: #f8fafc;
    }

    .card-header h2 {
        margin: 0;
        font-size: 1.5rem;
        font-weight: 600;
        color: var(--primary);
    }

    .subtitle {
        margin: 0.5rem 0 0 0;
        color: var(--text-secondary);
        font-size: 0.875rem;
    }

    .card-body {
        padding: 2rem;
    }

    /* Form Styles */
    .form-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 1.5rem;
        margin-bottom: 2rem;
    }

    .form-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    label {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        font-weight: 500;
        font-size: 0.875rem;
        color: var(--text-secondary);
    }

    .required {
        color: var(--error);
    }

    input, select {
        padding: 0.75rem;
        border: 1px solid var(--border);
        border-radius: var(--radius);
        font-size: 0.875rem;
        color: var(--text-primary);
        background-color: white;
        transition: var(--transition);
    }

    input:focus, select:focus {
        outline: none;
        border-color: var(--primary);
        box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.2);
    }

    input::placeholder {
        color: #9ca3af;
    }

    .select-wrapper {
        position: relative;
    }

    .select-arrow {
        position: absolute;
        right: 0.75rem;
        top: 50%;
        transform: translateY(-50%);
        pointer-events: none;
        color: var(--text-secondary);
        font-size: 0.75rem;
    }

    select {
        appearance: none;
        padding-right: 2rem;
        cursor: pointer;
    }

    /* Password Input */
    .password-input-wrapper {
        position: relative;
    }

    .toggle-password {
        position: absolute;
        right: 0.75rem;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        color: var(--text-secondary);
        cursor: pointer;
        padding: 0;
        font-size: 1rem;
    }

    .password-strength-container {
        margin-top: 0.5rem;
    }

    .password-strength-bar {
        height: 4px;
        background-color: #e2e8f0;
        border-radius: 2px;
        overflow: hidden;
        margin-bottom: 0.25rem;
    }

    .password-strength-progress {
        height: 100%;
        transition: width 0.3s ease, background-color 0.3s ease;
    }

    .password-strength-text {
        font-size: 0.75rem;
        color: var(--text-secondary);
    }

    /* Buttons */
    .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
    }

    .btn {
        padding: 0.75rem 1.5rem;
        border-radius: var(--radius);
        font-weight: 500;
        font-size: 0.875rem;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        transition: var(--transition);
        border: none;
    }

    .btn-primary {
        background-color: var(--primary);
        color: white;
    }

    .btn-primary:hover:not(:disabled) {
        background-color: var(--primary-hover);
    }

    .btn-primary:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }

    .btn-secondary {
        background-color: var(--secondary);
        color: var(--text-primary);
    }

    .btn-secondary:hover {
        background-color: var(--secondary-hover);
    }

    /* Messages */
    .message {
        padding: 1rem;
        border-radius: var(--radius);
        margin-bottom: 1.5rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .error {
        background-color: #fef2f2;
        color: #b91c1c;
        border-left: 4px solid var(--error);
    }

    .success {
        background-color: #ecfdf5;
        color: #065f46;
        border-left: 4px solid var(--success);
    }

    .icon {
        font-size: 1.25rem;
    }

    /* Loading Spinner */
    .loader {
        width: 1rem;
        height: 1rem;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        border-top-color: white;
        animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }

    /* Responsive Adjustments */
    @media (max-width: 768px) {
        .page-container {
            padding: 1rem;
        }

        .card-header, .card-body {
            padding: 1.25rem;
        }

        .form-grid {
            grid-template-columns: 1fr;
            gap: 1rem;
        }

        .form-actions {
            flex-direction: column-reverse;
        }

        .btn {
            width: 100%;
        }
    }
</style>