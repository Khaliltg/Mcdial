<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { fade, fly } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  
  // Création d'un store simple pour les erreurs
  import { writable } from 'svelte/store';
  const errorStore = writable('');
  
  let user = '';
  let pass = '';
  let isLoading = false;
  let error = '';
  let showPassword = false;
  
  // Form validation
  let userFocused = false;
  let passFocused = false;
  
  $: userError = userFocused && user.length < 3 ? 'Nom d\'utilisateur trop court' : '';
  $: passError = passFocused && pass.length < 4 ? 'Mot de passe trop court' : '';
  $: formIsValid = user.length >= 3 && pass.length >= 4;
  
  // URL de l'API backend
  const API_URL = 'http://localhost:8000/api';
  
  // Focus automatique sur le champ identifiant
  onMount(() => {
    document.getElementById('user-field')?.focus();
  });
  
  // Fonction pour gérer la soumission du formulaire
  async function handleSubmit() {
    if (!formIsValid || isLoading) return;
    
    try {
      isLoading = true;
      error = '';
      errorStore.set('');
      
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user, pass, role: 'agent' }),
        credentials: 'include' // Important pour que les cookies soient envoyés
      });
      
      const data = await res.json();
      console.log(data);
      
      if (res.ok) {
        // Vérifier si l'utilisateur a le niveau 1 (agent)
        if (data.user.user_level != 1) {
          error = 'Accès refusé. Seuls les agents peuvent se connecter ici.';
          errorStore.set(error);
          setTimeout(() => errorStore.set(''), 3000);
          isLoading = false;
          return;
        }
        
        // Stocker les informations dans localStorage
        // Le token est déjà stocké dans un cookie HTTP-only par le backend
        // Mais nous le stockons aussi dans localStorage pour la compatibilité
        localStorage.setItem('token', data.token || '');
        localStorage.setItem('user_level', data.user.user_level);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Ajouter manuellement le token dans un cookie accessible au JavaScript
        // pour assurer la compatibilité avec fetchWithAuth
        document.cookie = `token_js=${data.token}; path=/; max-age=28800;`;
        
        // Rediriger vers le tableau de bord agent
        goto('/agent/dashboard');
      } else {
        error = data.message || 'Échec de la connexion';
        errorStore.set(error);
        setTimeout(() => errorStore.set(''), 3000);
      }
    } catch (err: any) {
      console.error('Erreur de connexion:', err);
      error = 'Erreur de connexion au serveur';
      errorStore.set(error);
      setTimeout(() => errorStore.set(''), 3000);
    } finally {
      isLoading = false;
    }
  }
  
  // Fonction pour basculer la visibilité du mot de passe
  function togglePasswordVisibility() {
    showPassword = !showPassword;
  }
  
  // Fonction pour retourner à la page d'accueil
  function goBack() {
    goto('/');
  }
</script>

<style>
  .login-container {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    background: linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%);
  }
  
  .back-button {
    position: absolute;
    top: 20px;
    left: 20px;
    background: white;
    border: none;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s;
  }
  
  .back-button:hover {
    transform: translateX(-3px);
  }
  
  .login-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
    padding: 2rem;
  }
  
  .login-card {
    background: white;
    border-radius: 16px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    width: 100%;
    max-width: 450px;
    padding: 2.5rem;
  }
  
  .login-header {
    text-align: center;
    margin-bottom: 2rem;
  }
  
  .logo {
    width: 80px;
    height: 80px;
    background-color: #3b82f6;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 2rem;
    font-weight: bold;
    margin: 0 auto 1.5rem;
  }
  
  h1 {
    font-size: 1.75rem;
    color: #1f2937;
    margin-bottom: 0.5rem;
  }
  
  .subtitle {
    color: #6b7280;
    font-size: 1rem;
  }
  
  .form-group {
    margin-bottom: 1.5rem;
  }
  
  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #4b5563;
  }
  
  .password-input-wrapper {
    position: relative;
  }
  
  input[type="password"],
  input[type="text"] {
    width: 100%;
    padding: 0.75rem 1rem;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    font-size: 1rem;
    transition: border-color 0.2s;
  }
  
  input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  
  .toggle-password-btn {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    cursor: pointer;
    color: #666;
  }
  
  .error-message {
    color: #e53935;
    font-size: 0.85rem;
    margin-top: 0.5rem;
  }
  
  .input-error {
    border-color: #e53935;
  }
  
  .login-button {
    width: 100%;
    background-color: #3b82f6;
    color: white;
    border: none;
    border-radius: 8px;
    padding: 0.75rem;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .login-button:hover {
    background-color: #2563eb;
  }
  
  .login-button:disabled {
    background-color: #93c5fd;
    cursor: not-allowed;
  }
  
  .error-message {
    color: #ef4444;
    font-size: 0.875rem;
    margin-top: 0.5rem;
  }
  
  .spinner {
    width: 20px;
    height: 20px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top-color: white;
    animation: spin 0.8s linear infinite;
    margin-right: 0.5rem;
  }
  
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>

<div class="login-container">
  <button class="back-button" on:click={goBack} aria-label="Retour">
    <i class="bi bi-arrow-left"></i>
  </button>
  
  <div class="login-content">
    <div class="login-card" in:fly={{ y: 20, duration: 600, easing: quintOut }}>
      <div class="login-header">
        <div class="logo">M</div>
        <h1>Connexion Agent</h1>
        <p class="subtitle">Connectez-vous pour accéder à votre espace agent</p>
      </div>
      
      <form on:submit|preventDefault={handleSubmit}>
        {#if error}
          <div class="error-message" in:fade={{ duration: 200 }}>
            {error}
          </div>
        {/if}
        
        <div class="form-group">
          <label for="user-field">Identifiant</label>
          <input 
            type="text" 
            id="user-field" 
            bind:value={user} 
            placeholder="Votre identifiant" 
            autocomplete="username"
            on:focus={() => userFocused = true}
            class={userError ? 'input-error' : ''}
            required
          />
          {#if userError}
            <div class="error-message">{userError}</div>
          {/if}
        </div>
        
        <div class="form-group">
          <label for="password">Mot de passe</label>
          <div class="password-input-wrapper">
            {#if showPassword}
              <input 
                type="text" 
                id="password" 
                bind:value={pass} 
                placeholder="Votre mot de passe" 
                autocomplete="current-password"
                on:focus={() => passFocused = true}
                class={passError ? 'input-error' : ''}
                required
              />
            {:else}
              <input 
                type="password" 
                id="password" 
                bind:value={pass} 
                placeholder="Votre mot de passe" 
                autocomplete="current-password"
                on:focus={() => passFocused = true}
                class={passError ? 'input-error' : ''}
                required
              />
            {/if}
            <button 
              type="button" 
              class="toggle-password-btn" 
              on:click={togglePasswordVisibility}
            >
              {#if showPassword}
                <i class="bi bi-eye-slash"></i>
              {:else}
                <i class="bi bi-eye"></i>
              {/if}
            </button>
          </div>
          {#if passError}
            <div class="error-message">{passError}</div>
          {/if}
        </div>
        
        <button type="submit" class="login-button" disabled={!formIsValid || isLoading}>
          {#if isLoading}
            <div class="spinner"></div>
            Connexion en cours...
          {:else}
            <i class="bi bi-box-arrow-in-right"></i> Se connecter
          {/if}
        </button>
      </form>
    </div>
  </div>
</div>