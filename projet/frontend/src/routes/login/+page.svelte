<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { errorStore } from '$lib/stores/errorStore';
  
  let user = '';
  let pass = '';
  let error = '';
  let isLoading = false;
  let showPassword = false;
  
  // Form validation
  let userFocused = false;
  let passFocused = false;
  
  $: userError = userFocused && user.length < 3 ? 'Nom d\'utilisateur trop court' : '';
  $: passError = passFocused && pass.length < 4 ? 'Mot de passe trop court' : '';
  $: formIsValid = user.length >= 3 && pass.length >= 4;

  // If already logged in, redirect away
  onMount(() => {
    if (localStorage.getItem('token')) {
      goto('/');
    }
    
    // Focus the username field automatically
    document.getElementById('username-field')?.focus();
  });

  async function handleLogin() {
    if (!formIsValid || isLoading) return;
    
    try {
      isLoading = true;
      error = '';
      errorStore.set('');
      
      const res = await fetch('http://localhost:8000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user, pass })
      });
      
      const data = await res.json();
      console.log(data);
      
      if (res.ok) {
        // Check if user is admin (level 9)
        if (data.user_level != 9) { // Using loose comparison to handle both string '9' and number 9
          error = 'Accès refusé. Seuls les administrateurs peuvent se connecter.';
          errorStore.set(error);
          setTimeout(() => errorStore.set(''), 3000);
          isLoading = false;
          return;
        }
        
        localStorage.setItem('token', data.token);
        localStorage.setItem('user_level', data.user_level);
        localStorage.setItem('user', user);
        
        // Set cookies for SSR protection
        // Set cookies with compatibility for localhost (no Secure/SameSite if not https)
        const isLocalhost = window.location.hostname === 'localhost';
        if (isLocalhost && window.location.protocol === 'http:') {
          document.cookie = `token=${data.token}; path=/; max-age=28800`;
          document.cookie = `user_level=${data.user_level}; path=/; max-age=28800`;
        } else {
          document.cookie = `token=${data.token}; path=/; max-age=28800; SameSite=None; Secure`;
          document.cookie = `user_level=${data.user_level}; path=/; max-age=28800; SameSite=None; Secure`;
        }
        
        goto('/');
      } else {
        error = data.message || 'Échec de la connexion';
        errorStore.set(error);
        setTimeout(() => errorStore.set(''), 3000);
      }
    } catch (err) {
      console.error('Login error:', err);
      error = 'Erreur de connexion au serveur';
      errorStore.set(error);
      setTimeout(() => errorStore.set(''), 3000);
    } finally {
      isLoading = false;
    }
  }
  
  function togglePasswordVisibility() {
    showPassword = !showPassword;
  }
</script>

<div class="login-container">
  <div class="login-wrapper">
    <div class="login-card">
      <!-- Left side with brand and illustration -->
      <div class="login-brand-section">
        <div class="brand-content">
          <div class="logo-container">
            <i class="bi bi-graph-up-arrow"></i>
            <h1>Mcdial</h1>
          </div>
          <p class="brand-tagline">Gestion de campagnes simplifiée</p>
          <div class="illustration-container">
            <!-- SVG illustration could be added here -->
            <div class="abstract-shape shape-1"></div>
            <div class="abstract-shape shape-2"></div>
            <div class="abstract-shape shape-3"></div>
          </div>
        </div>
      </div>

      <!-- Right side with login form -->
      <div class="login-form-section">
        <div class="form-header">
          <h2>Connexion</h2>
          <p>Accédez à votre espace de gestion</p>
        </div>

        <form on:submit|preventDefault={handleLogin}>
          <!-- Username field -->
          <div class="form-group">
            <label for="username-field">Nom d'utilisateur</label>
            <div class="input-wrapper">
              <i class="bi bi-person input-icon"></i>
              <input 
                type="text" 
                id="username-field"
                class="form-input {userError ? 'input-error' : user ? 'input-valid' : ''}"
                placeholder="Entrez votre nom d'utilisateur" 
                bind:value={user} 
                on:focus={() => userFocused = true}
                on:blur={() => userFocused = true}
                required 
                autocomplete="username"
              />
            </div>
            {#if userError}
              <div class="error-message">{userError}</div>
            {/if}
          </div>
          
          <!-- Password field -->
          <div class="form-group">
            <label for="password-field">Mot de passe</label>
            <div class="input-wrapper">
              <i class="bi bi-lock input-icon"></i>
              {#if showPassword}
                <input 
                  type="text" 
                  id="password-field"
                  class="form-input {passError ? 'input-error' : pass ? 'input-valid' : ''}"
                  placeholder="Entrez votre mot de passe" 
                  bind:value={pass} 
                  on:focus={() => passFocused = true}
                  on:blur={() => passFocused = true}
                  required 
                  autocomplete="current-password"
                />
              {:else}
                <input 
                  type="password" 
                  id="password-field"
                  class="form-input {passError ? 'input-error' : pass ? 'input-valid' : ''}"
                  placeholder="Entrez votre mot de passe" 
                  bind:value={pass} 
                  on:focus={() => passFocused = true}
                  on:blur={() => passFocused = true}
                  required 
                  autocomplete="current-password"
                />
              {/if}
              <button 
                type="button" 
                class="toggle-password"
                on:click={togglePasswordVisibility}
              >
                <i class="bi {showPassword ? 'bi-eye-slash' : 'bi-eye'}"></i>
              </button>
            </div>
            {#if passError}
              <div class="error-message">{passError}</div>
            {/if}
          </div>
          
          <!-- Login button -->
          <button 
            type="submit" 
            class="login-button"
            disabled={!formIsValid || isLoading}
          >
            {#if isLoading}
              <span class="spinner"></span>
              <span>Connexion en cours...</span>
            {:else}
              <i class="bi bi-box-arrow-in-right"></i>
              <span>Se connecter</span>
            {/if}
          </button>
          
          <!-- Error message -->
          {#if error}
            <div class="error-alert">
              <i class="bi bi-exclamation-triangle-fill"></i>
              <span>{error}</span>
            </div>
          {/if}
          
          <!-- Footer with help text -->
          <div class="help-text">
            <p>Si vous rencontrez des difficultés pour vous connecter, veuillez contacter l'administrateur système.</p>
          </div>
        </form>

        <!-- Copyright footer -->
        <div class="copyright">
          <p>&copy; 2025 Mcdial. Tous droits réservés.</p>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    background-color: #f5f7fa;
    font-family: 'Poppins', 'Segoe UI', sans-serif;
    color: #333;
  }

  .login-container {
    min-height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 2rem;
  }

  .login-wrapper {
    width: 100%;
    max-width: 1000px;
  }

  .login-card {
    display: flex;
    background: white;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
  }

  /* Brand section styles */
  .login-brand-section {
    flex: 1;
    background: #1e88e5;
    color: white;
    padding: 3rem 2rem;
    display: flex;
    flex-direction: column;
    justify-content: center;
    position: relative;
    overflow: hidden;
  }

  .brand-content {
    position: relative;
    z-index: 2;
  }

  .logo-container {
    display: flex;
    align-items: center;
    margin-bottom: 1rem;
  }

  .logo-container i {
    font-size: 2.5rem;
    margin-right: 1rem;
  }

  .logo-container h1 {
    font-size: 2.5rem;
    font-weight: 700;
    margin: 0;
  }

  .brand-tagline {
    font-size: 1.2rem;
    opacity: 0.9;
    margin-bottom: 2rem;
  }

  .abstract-shape {
    position: absolute;
    border-radius: 50%;
    opacity: 0.1;
  }

  .shape-1 {
    width: 300px;
    height: 300px;
    background: white;
    bottom: -100px;
    right: -100px;
  }

  .shape-2 {
    width: 200px;
    height: 200px;
    background: white;
    top: 10%;
    right: -50px;
  }

  .shape-3 {
    width: 150px;
    height: 150px;
    background: white;
    bottom: 20%;
    left: -50px;
  }

  /* Form section styles */
  .login-form-section {
    flex: 1;
    padding: 3rem 2rem;
    display: flex;
    flex-direction: column;
  }

  .form-header {
    margin-bottom: 2rem;
  }

  .form-header h2 {
    font-size: 1.8rem;
    font-weight: 600;
    color: #333;
    margin: 0 0 0.5rem 0;
  }

  .form-header p {
    color: #666;
    margin: 0;
  }

  .form-group {
    margin-bottom: 1.5rem;
  }

  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #555;
  }

  .input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .input-icon {
    position: absolute;
    left: 1rem;
    color: #999;
  }

  .form-input {
    width: 100%;
    padding: 0.8rem 1rem 0.8rem 2.5rem;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 1rem;
    transition: all 0.3s ease;
  }

  .form-input:focus {
    outline: none;
    border-color: #1e88e5;
    box-shadow: 0 0 0 3px rgba(30, 136, 229, 0.1);
  }

  .form-input.input-error {
    border-color: #e53935;
  }

  .form-input.input-valid {
    border-color: #43a047;
  }

  .toggle-password {
    position: absolute;
    right: 1rem;
    background: none;
    border: none;
    color: #777;
    cursor: pointer;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
  }

  .toggle-password:hover {
    color: #333;
  }

  .error-message {
    color: #e53935;
    font-size: 0.85rem;
    margin-top: 0.5rem;
  }

  .login-button {
    width: 100%;
    padding: 1rem;
    background: #1e88e5;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: background 0.3s ease;
    margin-top: 1rem;
  }

  .login-button:hover {
    background: #1976d2;
  }

  .login-button:disabled {
    background: #90caf9;
    cursor: not-allowed;
  }

  .login-button i {
    margin-right: 0.5rem;
  }

  .spinner {
    width: 1.2rem;
    height: 1.2rem;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top-color: white;
    animation: spin 0.8s linear infinite;
    margin-right: 0.5rem;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .error-alert {
    display: flex;
    align-items: center;
    padding: 1rem;
    background: #ffebee;
    border-left: 4px solid #e53935;
    border-radius: 4px;
    color: #c62828;
    margin: 1.5rem 0;
  }

  .error-alert i {
    margin-right: 0.5rem;
    font-size: 1.2rem;
  }

  .help-text {
    text-align: center;
    color: #666;
    font-size: 0.9rem;
    margin-top: 2rem;
  }

  .copyright {
    text-align: center;
    color: #999;
    font-size: 0.8rem;
    margin-top: auto;
    padding-top: 2rem;
  }

  /* Responsive adjustments */
  @media (max-width: 768px) {
    .login-card {
      flex-direction: column;
    }

    .login-brand-section {
      padding: 2rem;
    }

    .login-form-section {
      padding: 2rem;
    }
  }
</style>
