<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { fade, fly } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';
  import { authStore } from '$lib/stores/authStore';
  
  // Création d'un store simple pour les erreurs
  import { writable } from 'svelte/store';
  const errorStore = writable('');
  
  let user = '';
  let pass = '';
  let isLoading = false;
  let error = '';
  let showPassword = false;
  let loginSuccess = false;
  let redirectAttempts = 0;
  
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
        body: JSON.stringify({ user, pass, role: 'admin' }),
        credentials: 'include' // Important pour que les cookies soient envoyés
      });
      
      const data = await res.json();
      console.log('Réponse du serveur:', data);
      
      if (res.ok) {
        // Vérifier si l'utilisateur a le niveau 9 (administrateur)
        if (data.user.user_level != 9) {
          error = 'Accès refusé. Seuls les administrateurs peuvent se connecter ici.';
          errorStore.set(error);
          setTimeout(() => errorStore.set(''), 3000);
          isLoading = false;
          return;
        }
        
        // Stocker les informations dans localStorage
        console.log('Connexion réussie, stockage des informations...');
        localStorage.setItem('token', data.token || '');
        localStorage.setItem('user_level', data.user.user_level);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Ajouter manuellement le token dans un cookie accessible au JavaScript
        document.cookie = `token_js=${data.token}; path=/; max-age=28800;`;
        
        // Mettre à jour le store d'authentification
        authStore.login(data.user, data.token, data.user.user_level);
        
        // Indiquer que la connexion a réussi
        loginSuccess = true;
        console.log('Connexion réussie, tentative de redirection automatique...');
        
        // Essayer plusieurs méthodes de redirection
        const tryRedirect = () => {
          redirectAttempts++;
          console.log(`Tentative de redirection #${redirectAttempts}`);
          
          if (redirectAttempts <= 3) {
            try {
              window.location.href = '/admin/dashboard';
              
              // Si la redirection directe échoue, essayer après un délai
              setTimeout(() => {
                if (window.location.pathname.includes('/admin/login')) {
                  console.log('Redirection automatique échouée, nouvel essai...');
                  tryRedirect();
                }
              }, 1000);
            } catch (e) {
              console.error('Erreur lors de la redirection:', e);
            }
          } else {
            console.log('Redirection automatique échouée après plusieurs tentatives, affichage du lien manuel');
          }
        };
        
        // Démarrer la tentative de redirection
        tryRedirect();
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
    background: linear-gradient(135deg, #1a237e 0%, #283593 100%);
    color: white;
  }
  
  .back-button {
    position: absolute;
    top: 20px;
    left: 20px;
    background: rgba(255, 255, 255, 0.2);
    border: none;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: white;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
    transition: transform 0.2s, background 0.2s;
  }
  
  .back-button:hover {
    transform: translateX(-3px);
    background: rgba(255, 255, 255, 0.3);
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
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border-radius: 16px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    width: 100%;
    max-width: 450px;
    padding: 2.5rem;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
  
  .login-header {
    text-align: center;
    margin-bottom: 2rem;
  }
  
  .logo {
    width: 80px;
    height: 80px;
    background-color: rgba(255, 255, 255, 0.15);
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 2rem;
    font-weight: bold;
    margin: 0 auto 1.5rem;
    border: 2px solid rgba(255, 255, 255, 0.3);
  }
  
  h1 {
    font-size: 1.75rem;
    color: white;
    margin-bottom: 0.5rem;
  }
  
  .subtitle {
    color: rgba(255, 255, 255, 0.8);
    font-size: 1rem;
  }
  
  .form-group {
    margin-bottom: 1.5rem;
  }
  
  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.9);
  }
  
  .password-input-wrapper {
    position: relative;
  }
  
  input[type="password"],
  input[type="text"] {
    width: 100%;
    padding: 0.75rem 1rem;
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 8px;
    font-size: 1rem;
    transition: border-color 0.2s;
    background: rgba(255, 255, 255, 0.1);
    color: white;
  }
  
  input::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
  
  input:focus {
    outline: none;
    border-color: rgba(255, 255, 255, 0.6);
    box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.1);
  }
  
  .toggle-password-btn {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    cursor: pointer;
    color: rgba(255, 255, 255, 0.7);
  }
  
  .toggle-password-btn:hover {
    color: white;
  }
  
  .error-message {
    color: #ff9e80;
    font-size: 0.85rem;
    margin-top: 0.5rem;
  }
  
  .success-message {
    background: rgba(255, 255, 255, 0.15);
    border-radius: 8px;
    padding: 1.5rem;
    text-align: center;
    margin-bottom: 1.5rem;
    border: 1px solid rgba(255, 255, 255, 0.3);
  }
  
  .success-message i {
    font-size: 3rem;
    color: #4CAF50;
    margin-bottom: 1rem;
  }
  
  .dashboard-link {
    display: inline-block;
    background: rgba(255, 255, 255, 0.25);
    color: white;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    text-decoration: none;
    margin-top: 1rem;
    font-weight: 500;
    transition: background 0.2s;
  }
  
  .dashboard-link:hover {
    background: rgba(255, 255, 255, 0.35);
  }
  
  .input-error {
    border-color: #ff9e80;
  }
  
  .login-button {
    width: 100%;
    background-color: rgba(255, 255, 255, 0.2);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.3);
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
    background-color: rgba(255, 255, 255, 0.3);
  }
  
  .login-button:disabled {
    background-color: rgba(255, 255, 255, 0.1);
    cursor: not-allowed;
    opacity: 0.7;
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
        <h1>Connexion Administrateur</h1>
        <p class="subtitle">Accédez à votre espace de gestion</p>
      </div>
      
      {#if loginSuccess}
        <div class="success-message" in:fade={{ duration: 200 }}>
          <i class="bi bi-check-circle"></i>
          <p>Connexion réussie!</p>
          <p>Cliquez sur le bouton ci-dessous pour accéder au tableau de bord:</p>
          <a href="/admin/dashboard" class="dashboard-link">
            <i class="bi bi-speedometer2"></i> Accéder au tableau de bord
          </a>
        </div>
      {:else}
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
            placeholder="Identifiant administrateur" 
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
                placeholder="Mot de passe administrateur" 
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
                placeholder="Mot de passe administrateur" 
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
            <i class="bi bi-shield-lock"></i> Se connecter
          {/if}
        </button>
      </form>
      {/if}
    </div>
  </div>
</div>