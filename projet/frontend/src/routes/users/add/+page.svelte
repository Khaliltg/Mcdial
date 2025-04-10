<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  let newUser = {
    user: '',
    full_name: '',
    user_level: '',
    active: 'Y',
    user_group: '',
    phone_login: '',
    phone_pass: '',
    password: '',
    password_confirm: ''
  };
  
  let userGroups = [];
  let userLevels = ['admin', 'manager', 'agent', 'standard'];
  let isLoading = false;
  let isSubmitting = false;
  let errors = {};
  
  // Notification system
  let notification = { message: '', type: '', visible: false };
  
  function showNotification(message, type = 'info') {
    notification = { message, type, visible: true };
    setTimeout(() => {
      notification = { ...notification, visible: false };
    }, 5000);
  }

  // Fonction pour charger les groupes d'utilisateurs
  async function loadUserGroups() {
    isLoading = true;
    try {
      const res = await fetch('http://localhost:8000/api/admin/user/users-group');
      if (res.ok) {
        userGroups = await res.json();
      } else {
        throw new Error('Erreur lors de la récupération des groupes d\'utilisateurs');
      }
    } catch (error) {
      showNotification(error.message, 'error');
    } finally {
      isLoading = false;
    }
  }

  // Validation du formulaire
  function validateForm() {
    errors = {};
    
    if (!newUser.user.trim()) {
      errors.user = "Le nom d'utilisateur est requis";
    } else if (!/^[a-zA-Z0-9_-]+$/.test(newUser.user)) {
      errors.user = "Le nom d'utilisateur ne doit contenir que des lettres, chiffres, tirets et underscores";
    }
    
    if (!newUser.full_name.trim()) {
      errors.full_name = "Le nom complet est requis";
    }
    
    if (!newUser.user_level) {
      errors.user_level = "Veuillez sélectionner un niveau d'utilisateur";
    }
    
    if (!newUser.user_group) {
      errors.user_group = "Veuillez sélectionner un groupe d'utilisateur";
    }
    
    if (newUser.password.length < 8) {
      errors.password = "Le mot de passe doit contenir au moins 8 caractères";
    }
    
    if (newUser.password !== newUser.password_confirm) {
      errors.password_confirm = "Les mots de passe ne correspondent pas";
    }
    
    return Object.keys(errors).length === 0;
  }

  // Fonction pour ajouter un nouvel utilisateur
  async function addUser() {
    if (!validateForm()) {
      showNotification("Veuillez corriger les erreurs dans le formulaire", "error");
      return;
    }
    
    isSubmitting = true;
    try {
      // Créer une copie de l'objet sans le champ de confirmation de mot de passe
      const userToSubmit = { ...newUser };
      delete userToSubmit.password_confirm;
      
      const response = await fetch('http://localhost:8000/api/admin/user/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userToSubmit),
      });
      
      if (response.ok) {
        showNotification('Utilisateur ajouté avec succès !', 'success');
        setTimeout(() => {
          goto('/users'); // Redirection après un court délai
        }, 1500);
      } else {
        const errorData = await response.json();
        showNotification(`Erreur: ${errorData.error || 'Une erreur est survenue'}`, 'error');
      }
    } catch (error) {
      showNotification('Une erreur est survenue lors de la communication avec le serveur.', 'error');
    } finally {
      isSubmitting = false;
    }
  }

  // Fonction pour générer un mot de passe aléatoire
  function generateRandomPassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    newUser.password = password;
    newUser.password_confirm = password;
  }

  // Fonction pour annuler et retourner à la page précédente
  function cancel() {
    goto('/users/list');
  }

  // Charger les données au montage du composant
  onMount(() => {
    loadUserGroups();
  });
</script>

<div class="page-container">
  {#if notification.visible}
    <div class="notification {notification.type}">
      <span>{notification.message}</span>
      <button on:click={() => notification = {...notification, visible: false}}>×</button>
    </div>
  {/if}

  <div class="page-header">
    <h1>Ajouter un nouvel utilisateur</h1>
    <p class="subtitle">Créez un nouveau compte utilisateur avec les permissions appropriées</p>
  </div>

  <div class="card">
    {#if isLoading}
      <div class="loading-container">
        <div class="loading-spinner"></div>
        <p>Chargement des données...</p>
      </div>
    {:else}
      <form on:submit|preventDefault={addUser} class="form-container">
        <div class="form-section">
          <h2 class="section-title">Informations de base</h2>
          
          <div class="form-row">
            <div class="form-group">
              <label for="user" class="form-label">Nom d'utilisateur <span class="required">*</span></label>
              <input 
                type="text" 
                id="user" 
                bind:value={newUser.user} 
                class="form-input {errors.user ? 'input-error' : ''}" 
                placeholder="Exemple: john_doe" 
                required
              />
              {#if errors.user}
                <p class="error-message">{errors.user}</p>
              {/if}
              <p class="input-help">Identifiant unique pour la connexion au système</p>
            </div>
            
            <div class="form-group">
              <label for="full_name" class="form-label">Nom complet <span class="required">*</span></label>
              <input 
                type="text" 
                id="full_name" 
                bind:value={newUser.full_name} 
                class="form-input {errors.full_name ? 'input-error' : ''}" 
                placeholder="Exemple: John Doe" 
                required
              />
              {#if errors.full_name}
                <p class="error-message">{errors.full_name}</p>
              {/if}
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="user_level" class="form-label">Niveau d'utilisateur <span class="required">*</span></label>
              <select 
                id="user_level" 
                bind:value={newUser.user_level} 
                class="form-input form-select {errors.user_level ? 'input-error' : ''}"
                required
              >
                <option value="" disabled selected>Sélectionner un niveau</option>
                {#each userLevels as level}
                  <option value={level}>{level.charAt(0).toUpperCase() + level.slice(1)}</option>
                {/each}
              </select>
              {#if errors.user_level}
                <p class="error-message">{errors.user_level}</p>
              {/if}
              <p class="input-help">Détermine les permissions de l'utilisateur</p>
            </div>
            
            <div class="form-group">
              <label for="user_group" class="form-label">Groupe d'utilisateur <span class="required">*</span></label>
              <select 
                id="user_group" 
                bind:value={newUser.user_group} 
                class="form-input form-select {errors.user_group ? 'input-error' : ''}"
                required
              >
                <option value="" disabled selected>Sélectionner un groupe</option>
                {#each userGroups as group}
                  <option value={group.user_group}>{group.group_name || group.user_group}</option>
                {/each}
              </select>
              {#if errors.user_group}
                <p class="error-message">{errors.user_group}</p>
              {/if}
              {#if userGroups.length === 0}
                <p class="warning-message">Aucun groupe disponible. Veuillez d'abord créer un groupe.</p>
              {/if}
            </div>
          </div>
          
          <div class="form-group">
            <label for="active" class="form-label">Statut du compte</label>
            <div class="toggle-container">
              <label class="toggle">
                <input 
                  type="checkbox" 
                  id="active"
                  checked={newUser.active === 'Y'} 
                  on:change={() => newUser.active = newUser.active === 'Y' ? 'N' : 'Y'}
                />
                <span class="slider"></span>
              </label>
              <span class="toggle-label">{newUser.active === 'Y' ? 'Actif' : 'Inactif'}</span>
            </div>
            <p class="input-help">Un compte inactif ne pourra pas se connecter au système</p>
          </div>
        </div>
        
        <div class="form-section">
          <h2 class="section-title">Informations téléphoniques</h2>
          
          <div class="form-row">
            <div class="form-group">
              <label for="phone_login" class="form-label">Login téléphonique</label>
              <input 
                type="text" 
                id="phone_login" 
                bind:value={newUser.phone_login} 
                class="form-input" 
                placeholder="Login pour le téléphone"
              />
              <p class="input-help">Identifiant pour la connexion au système téléphonique</p>
            </div>
            
            <div class="form-group">
              <label for="phone_pass" class="form-label">Mot de passe téléphonique</label>
              <input 
                type="text" 
                id="phone_pass" 
                bind:value={newUser.phone_pass} 
                class="form-input" 
                placeholder="Mot de passe pour le téléphone"
              />
            </div>
          </div>
        </div>
        
        <div class="form-section">
          <h2 class="section-title">Sécurité</h2>
          
          <div class="form-row">
            <div class="form-group">
              <label for="password" class="form-label">Mot de passe <span class="required">*</span></label>
              <div class="password-input-container">
                <input 
                  type="password" 
                  id="password" 
                  bind:value={newUser.password} 
                  class="form-input {errors.password ? 'input-error' : ''}" 
                  placeholder="Minimum 8 caractères" 
                  required
                />
                <button type="button" class="password-generate-btn" on:click={generateRandomPassword}>
                  Générer
                </button>
              </div>
              {#if errors.password}
                <p class="error-message">{errors.password}</p>
              {/if}
            </div>
            
            <div class="form-group">
              <label for="password_confirm" class="form-label">Confirmer le mot de passe <span class="required">*</span></label>
              <input 
                type="password" 
                id="password_confirm" 
                bind:value={newUser.password_confirm} 
                class="form-input {errors.password_confirm ? 'input-error' : ''}" 
                placeholder="Répétez le mot de passe" 
                required
              />
              {#if errors.password_confirm}
                <p class="error-message">{errors.password_confirm}</p>
              {/if}
            </div>
          </div>
          
          <p class="security-note">
            <span class="icon">🔒</span> Assurez-vous d'utiliser un mot de passe fort contenant des lettres, chiffres et caractères spéciaux
          </p>
        </div>
        
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" on:click={cancel}>Annuler</button>
          <button type="submit" class="btn btn-primary" disabled={isSubmitting}>
            {#if isSubmitting}
              <span class="spinner-small"></span> Création en cours...
            {:else}
              Créer l'utilisateur
            {/if}
          </button>
        </div>
      </form>
    {/if}
  </div>
</div>

<style>
  /* Base Styles */
  :global(body) {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    background-color: #f5f7fa;
    color: #333;
    line-height: 1.5;
  }

  .page-container {
    max-width: 900px;
    margin: 0 auto;
    padding: 2rem;
    position: relative;
  }

  /* Header Styles */
  .page-header {
    margin-bottom: 2rem;
  }

  .page-header h1 {
    font-size: 2rem;
    font-weight: 700;
    color: #2563eb;
    margin-bottom: 0.5rem;
  }

  .subtitle {
    color: #64748b;
    margin-top: 0;
  }

  /* Card Styles */
  .card {
    background-color: white;
    border-radius: 12px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    margin-bottom: 2rem;
    overflow: hidden;
  }

  /* Form Styles */
  .form-container {
    padding: 2rem;
  }

  .form-section {
    margin-bottom: 2rem;
    padding-bottom: 1.5rem;
    border-bottom: 1px solid #e5e7eb;
  }

  .form-section:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  .section-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1e293b;
    margin-top: 0;
    margin-bottom: 1.5rem;
  }

  .form-row {
    display: flex;
    gap: 1.5rem;
    margin-bottom: 1rem;
  }

  .form-group {
    flex: 1;
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

  .form-input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  .form-input:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }

  .form-select {
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236b7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 0.75rem center;
    background-size: 1rem;
    padding-right: 2.5rem;
  }

  .input-error {
    border-color: #ef4444;
  }

  .error-message {
    color: #ef4444;
    font-size: 0.75rem;
    margin-top: 0.5rem;
    margin-bottom: 0;
  }

  .warning-message {
    color: #f59e0b;
    font-size: 0.875rem;
    margin-top: 0.5rem;
    margin-bottom: 0;
  }

  .input-help {
    color: #6b7280;
    font-size: 0.75rem;
    margin-top: 0.5rem;
    margin-bottom: 0;
  }

  /* Password Input */
  .password-input-container {
    position: relative;
    display: flex;
  }

  .password-generate-btn {
    position: absolute;
    right: 0;
    top: 0;
    height: 100%;
    padding: 0 0.75rem;
    background-color: #f3f4f6;
    border: none;
    border-left: 1px solid #d1d5db;
    border-top-right-radius: 0.375rem;
    border-bottom-right-radius: 0.375rem;
    color: #4b5563;
    font-size: 0.75rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .password-generate-btn:hover {
    background-color: #e5e7eb;
  }

  .security-note {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #6b7280;
    font-size: 0.875rem;
    margin-top: 0.5rem;
    padding: 0.75rem;
    background-color: #f9fafb;
    border-radius: 0.375rem;
    border-left: 3px solid #2563eb;
  }

  /* Toggle Switch */
  .toggle-container {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .toggle {
    position: relative;
    display: inline-block;
    width: 48px;
    height: 24px;
  }

  .toggle input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #cbd5e1;
    transition: 0.4s;
    border-radius: 24px;
  }

  .slider:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: 0.4s;
    border-radius: 50%;
  }

  input:checked + .slider {
    background-color: #2563eb;
  }

  input:checked + .slider:before {
    transform: translateX(24px);
  }

  .toggle-label {
    font-size: 0.875rem;
    font-weight: 500;
  }

  /* Button Styles */
  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 2rem;
  }

  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.625rem 1.25rem;
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
  }

  .btn-primary:disabled {
    background-color: #93c5fd;
    cursor: not-allowed;
  }

  .btn-secondary {
    background-color: #e5e7eb;
    color: #4b5563;
  }

  .btn-secondary:hover {
    background-color: #d1d5db;
  }

  /* Loading Spinner */
  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem 1.5rem;
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #e0e7ff;
    border-top: 4px solid #2563eb;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }

  .spinner-small {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.5);
    border-top: 2px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    display: inline-block;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* Notification */
  .notification {
    position: fixed;
    top: 1rem;
    right: 1rem;
    padding: 1rem 1.5rem;
    border-radius: 0.375rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    z-index: 1100;
    animation: slideIn 0.3s ease-out;
    max-width: 400px;
  }

  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }

  .notification.success {
    background-color: #ecfdf5;
    color: #047857;
    border-left: 4px solid #10b981;
  }

  .notification.error {
    background-color: #fef2f2;
    color: #b91c1c;
    border-left: 4px solid #ef4444;
  }

  .notification.info {
    background-color: #eff6ff;
    color: #1d4ed8;
    border-left: 4px solid #3b82f6;
  }

  .notification button {
    background-color: transparent;
    border: none;
    font-size: 1.25rem;
    cursor: pointer;
    color: currentColor;
    opacity: 0.7;
  }

  .notification button:hover {
    opacity: 1;
  }

  /* Responsive Adjustments */
  @media (max-width: 768px) {
    .page-container {
      padding: 1rem;
    }

    .form-container {
      padding: 1.5rem;
    }

    .form-row {
      flex-direction: column;
      gap: 0;
    }

    .form-actions {
      flex-direction: column-reverse;
    }

    .btn {
      width: 100%;
    }

    .notification {
      left: 1rem;
      right: 1rem;
      max-width: none;
    }
  }
</style>