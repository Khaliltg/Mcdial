<script lang="ts">
  import { onMount } from 'svelte';
  import { API_BASE_URL } from '../utils/config';
  import { agentState } from '../stores/agent';
  
  // Get the base URL without the /api suffix for auth endpoints
  const AUTH_BASE_URL = API_BASE_URL.replace('/api', '');
  
  // Variable pour suivre si la vérification d'authentification a été effectuée
  let authCheckDone = false;
  
  // Fonction pour vérifier l'authentification au chargement
  async function checkAuthentication() {
    // Si la vérification a déjà été effectuée, ne pas la refaire
    if (authCheckDone) return;
    
    console.log('Page de connexion chargée - Vérification de l\'authentification');
    
    // Vérifier si un token existe dans localStorage
    const token = localStorage.getItem('agent_token') || localStorage.getItem('token');
    const jwtCookie = document.cookie.includes('jwt=');
    
    console.log('État d\'authentification:', { token: !!token, hasJwtCookie: jwtCookie });
    
    // Marquer la vérification comme effectuée pour éviter les boucles
    authCheckDone = true;
    
    // IMPORTANT: Ne pas rediriger automatiquement pour éviter les boucles de redirection
    // La redirection sera gérée par App.svelte uniquement
  }
  
  // Étape actuelle du processus de connexion
  enum LoginStep {
    PHONE = 1,
    USER = 2,
    CAMPAIGN = 3
  }
  
  // Variables pour le formulaire de connexion téléphonique (étape 1)
  let phoneLogin = '';
  let phonePassword = '';
  
  // Variables pour le formulaire de connexion utilisateur (étape 2)
  let userLogin = '';
  let userPassword = '';
  
  // Variables pour la sélection de campagne (étape 3)
  let selectedCampaignId = '';
  let campaigns: Campaign[] = [];
  
  // Interface pour les campagnes
  interface Campaign {
    id: string;
    name: string;
    description?: string;
    active: boolean;
  }
  
  // Variables générales
  let currentStep = LoginStep.PHONE;
  let rememberMe = false;
  let isLoading = false;
  let errorMessage = '';
  let phoneSessionToken = '';
  let userSessionToken = '';
  
  // Fonction pour gérer la connexion téléphonique (étape 1)
  async function handlePhoneLogin() {
    if (!phoneLogin || !phonePassword) {
      errorMessage = 'Veuillez saisir votre identifiant et mot de passe téléphonique';
      return;
    }
    
    try {
      isLoading = true;
      errorMessage = '';
      
      // Appel API au backend pour l'authentification téléphonique
      const response = await fetch(`${AUTH_BASE_URL}/api/agent/auth/phone-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phoneLogin, phonePassword }),
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Stocker le token de session téléphonique temporaire
        if (data.phoneSessionToken) {
          phoneSessionToken = data.phoneSessionToken;
          
          // Passer à l'étape suivante (connexion utilisateur)
          currentStep = LoginStep.USER;
        } else {
          throw new Error('Token de session téléphonique non reçu');
        }
      } else {
        // Gérer les différents codes d'erreur
        if (response.status === 401) {
          errorMessage = 'Identifiant ou mot de passe téléphonique incorrect';
        } else {
          const errorData = await response.json().catch(() => ({}));
          errorMessage = errorData.message || 'Échec de la connexion téléphonique';
        }
      }
    } catch (error: unknown) {
      console.error('Erreur de connexion téléphonique:', error);
      errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue lors de la connexion téléphonique';
    } finally {
      isLoading = false;
    }
  }
  
  // Fonction pour gérer la connexion utilisateur (étape 2)
  async function handleUserLogin() {
    if (!userLogin || !userPassword) {
      errorMessage = 'Veuillez saisir votre identifiant et mot de passe utilisateur';
      return;
    }
    
    try {
      isLoading = true;
      errorMessage = '';
      
      // Appel API au backend pour l'authentification utilisateur
      const response = await fetch(`${AUTH_BASE_URL}/api/agent/auth/user-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${phoneSessionToken}` // Utiliser le token de session téléphonique
        },
        body: JSON.stringify({ userLogin, userPassword }),
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Stocker le token de session utilisateur
        if (data.userSessionToken) {
          userSessionToken = data.userSessionToken;
        } else {
          throw new Error('Token de session utilisateur non reçu');
        }
        
        // Récupérer la liste des campagnes disponibles
        campaigns = data.campaigns || [];
        
        if (campaigns.length > 0) {
          // Passer à l'étape suivante (sélection de campagne)
          currentStep = LoginStep.CAMPAIGN;
        } else {
          errorMessage = 'Aucune campagne disponible pour cet utilisateur';
        }
      } else {
        // Gérer les différents codes d'erreur
        if (response.status === 401) {
          errorMessage = 'Identifiant ou mot de passe utilisateur incorrect';
        } else {
          const errorData = await response.json().catch(() => ({}));
          errorMessage = errorData.message || 'Échec de la connexion utilisateur';
        }
      }
    } catch (error: unknown) {
      console.error('Erreur de connexion utilisateur:', error);
      errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue lors de la connexion utilisateur';
    } finally {
      isLoading = false;
    }
  }
  
  // Vérifier l'authentification au chargement de la page
  onMount(() => {
    checkAuthentication();
  });
  
  // Fonction pour finaliser la connexion avec la sélection de campagne (étape 3)
  async function handleCampaignSelection() {
    if (!selectedCampaignId) {
      errorMessage = 'Veuillez sélectionner une campagne';
      return;
    }
    
    try {
      isLoading = true;
      errorMessage = '';
      
      console.log('Début de la sélection de campagne avec ID:', selectedCampaignId);
      console.log('Token de session utilisateur:', userSessionToken ? userSessionToken.substring(0, 20) + '...' : 'Non disponible');
      
      // Préparer les données pour l'appel API
      const requestBody = { campaignId: selectedCampaignId };
      console.log('Données envoyées:', requestBody);
      
      // URL complète pour débogage
      const apiUrl = `${AUTH_BASE_URL}/api/agent/auth/select-campaign`;
      console.log('URL de l\'API appelée:', apiUrl);
      
      // Appel API au backend pour finaliser la connexion avec la campagne sélectionnée
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userSessionToken}` // Utiliser le token de session utilisateur
        },
        body: JSON.stringify(requestBody),
        credentials: 'include'
      }).catch(fetchError => {
        console.error('Erreur fetch lors de la sélection de campagne:', fetchError);
        throw new Error(`Erreur réseau: ${fetchError.message}`);
      });
      
      console.log('Réponse du serveur:', response.status, response.statusText);
      console.log('En-têtes de réponse:', [...response.headers.entries()]);
      
      // Tenter de lire le corps de la réponse pour débogage
      const responseText = await response.text();
      console.log('Corps de la réponse (brut):', responseText.substring(0, 200) + (responseText.length > 200 ? '...' : ''));
      
      let data;
      try {
        // Convertir la réponse texte en JSON
        data = JSON.parse(responseText);
        console.log('Réponse de sélection de campagne (JSON):', data);
      } catch (jsonError) {
        console.error('Erreur de parsing JSON:', jsonError);
        errorMessage = 'Format de réponse invalide du serveur';
        isLoading = false;
        return;
      }
      
      if (response.ok && data) {
        // Stocker le token final dans localStorage
        if (data.token) {
          console.log('Token reçu, stockage dans localStorage');
          // Store in both locations for compatibility
          localStorage.setItem('agent_token', data.token);
          localStorage.setItem('token', data.token);
          localStorage.setItem('agent_campaign_id', selectedCampaignId);
          localStorage.setItem('campaign_id', selectedCampaignId);
          localStorage.setItem('agent_full_name', data.full_name || '');
          localStorage.setItem('full_name', data.full_name || '');
          
          // Gérer l'option "Se souvenir de moi"
          if (rememberMe) {
            localStorage.setItem('agent_phone_login', phoneLogin);
            
            // Définir un cookie de longue durée (30 jours) si "Se souvenir de moi" est coché
            const expirationDate = new Date();
            expirationDate.setDate(expirationDate.getDate() + 30);
            document.cookie = `remember_agent=true; expires=${expirationDate.toUTCString()}; path=/;`;
          } else {
            localStorage.removeItem('agent_phone_login');
            document.cookie = 'remember_agent=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
          }
          
          // Vérifier si les cookies ont été correctement définis
          console.log('Vérification des cookies après authentification:');
          console.log('Cookies disponibles:', document.cookie);
          console.log('JWT cookie présent:', document.cookie.includes('jwt='));
          console.log('auth_success cookie présent:', document.cookie.includes('auth_success='));
          
          // Afficher un message de succès
          alert('Connexion réussie ! Bienvenue sur McDial.');
          
          // Forcer une redirection directe sans utiliser goto
          console.log('Redirection forcée vers la page d\'accueil...');
          
          // Utiliser window.location.replace pour éviter d'ajouter une entrée dans l'historique
          // Cela aide à éviter les boucles de redirection
          window.location.replace('/');
        } else {
          console.error('Token final non reçu du serveur');
          errorMessage = 'Token d\'authentification non reçu du serveur';
        }
      } else {
        // Gérer les différents codes d'erreur
        if (data && data.message) {
          console.error('Erreur de sélection de campagne:', data);
          errorMessage = data.message || 'Échec de la sélection de campagne';
        } else {
          errorMessage = `Échec de la sélection de campagne (${response.status}): ${response.statusText}`;
        }
      }
    } catch (error: unknown) {
      console.error('Erreur lors de la sélection de campagne:', error);
      errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue lors de la sélection de campagne';
    } finally {
      isLoading = false;
    }
  }
  
  // Fonction pour revenir à l'étape précédente
  function goBack() {
    if (currentStep === LoginStep.USER) {
      currentStep = LoginStep.PHONE;
      phoneSessionToken = '';
      userSessionToken = '';
    } else if (currentStep === LoginStep.CAMPAIGN) {
      currentStep = LoginStep.USER;
      userSessionToken = '';
    }
    errorMessage = '';
  }
  
  onMount(() => {
    console.log('Page de connexion chargée - Vérification de l\'authentification');
    
    // Vérifier si l'utilisateur a déjà un token valide et un cookie JWT
    const token = localStorage.getItem('agent_token');
    const hasJwtCookie = document.cookie.split(';').some(item => item.trim().startsWith('jwt='));
    
    console.log('État d\'authentification:', { token: !!token, hasJwtCookie });
    
    if (token && hasJwtCookie) {
      // Si l'utilisateur est déjà authentifié, rediriger vers la page d'accueil
      console.log('Utilisateur déjà authentifié, redirection vers la page d\'accueil');
      window.location.href = '/';
      return;
    }
    
    // Récupérer le nom d'utilisateur si "Se souvenir de moi" était coché
    const savedPhoneLogin = localStorage.getItem('agent_phone_login');
    const hasRememberCookie = document.cookie.split(';').some(item => item.trim().startsWith('remember_agent='));
    
    if (savedPhoneLogin && hasRememberCookie) {
      console.log('Identifiants sauvegardés trouvés');
      phoneLogin = savedPhoneLogin;
      rememberMe = true;
    }
  });
  
  // Fonction pour vérifier la validité du token
  async function verifyToken(token: string): Promise<boolean> {
    try {
      console.log('Vérification du token...');
      const response = await fetch(`${API_BASE_URL}/api/agent/auth/verify-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });
      
      const result = response.ok;
      console.log('Résultat de la vérification du token:', result);
      return result;
    } catch (error) {
      console.error('Erreur lors de la vérification du token:', error);
      return false;
    }
  }
</script>

<div class="login-container">
  <div class="login-card-wrapper container d-flex flex-column align-items-center justify-content-center">
    <div class="card login-card shadow-lg">
      <div class="card-body p-4">
        <div class="text-center mb-4">
          <div class="logo-container">
            <div class="logo-circle bg-primary">M</div>
          </div>
          <h2 class="card-title mb-1">McDial Agent</h2>
          <p class="text-muted">
            {#if currentStep === LoginStep.PHONE}
              Étape 1/3 : Connexion téléphonique
            {:else if currentStep === LoginStep.USER}
              Étape 2/3 : Connexion utilisateur
            {:else}
              Étape 3/3 : Sélection de campagne
            {/if}
          </p>
        </div>
        
        <!-- Progress steps -->
        <div class="progress-steps d-flex justify-content-between mb-4">
          <div class="step-item d-flex flex-column align-items-center {currentStep >= LoginStep.PHONE ? 'active' : ''}">
            <div class="step-circle">1</div>
            <div class="step-label">Téléphone</div>
          </div>
          
          <div class="step-connector"></div>
          
          <div class="step-item d-flex flex-column align-items-center {currentStep >= LoginStep.USER ? 'active' : ''}">
            <div class="step-circle">2</div>
            <div class="step-label">Utilisateur</div>
          </div>
          
          <div class="step-connector"></div>
          
          <div class="step-item d-flex flex-column align-items-center {currentStep >= LoginStep.CAMPAIGN ? 'active' : ''}">
            <div class="step-circle">3</div>
            <div class="step-label">Campagne</div>
          </div>
        </div>
        
        {#if errorMessage}
          <div class="alert alert-danger mb-4 fade show d-flex align-items-center" role="alert">
            <i class="bi bi-exclamation-triangle-fill me-2 fs-5"></i>
            <div class="flex-grow-1">{errorMessage}</div>
            <button type="button" class="btn-close" aria-label="Close" on:click={() => errorMessage = ''}></button>
          </div>
        {/if}
        
        <!-- Étape 1 : Connexion téléphonique -->
        {#if currentStep === LoginStep.PHONE}
          <form on:submit|preventDefault={handlePhoneLogin} class="mb-3">
            <div class="form-floating mb-3">
              <input 
                type="text" 
                class="form-control" 
                id="phoneLogin" 
                placeholder="Phone Login"
                bind:value={phoneLogin}
                disabled={isLoading}
                required
              />
              <label for="phoneLogin">Phone Login</label>
            </div>
            
            <div class="form-floating mb-4">
              <input 
                type="password" 
                class="form-control" 
                id="phonePassword" 
                placeholder="Phone Password"
                bind:value={phonePassword}
                disabled={isLoading}
                required
              />
              <label for="phonePassword">Phone Password</label>
            </div>
            
            <div class="form-check mb-4">
              <input 
                class="form-check-input" 
                type="checkbox" 
                id="rememberMe"
                bind:checked={rememberMe}
              />
              <label class="form-check-label" for="rememberMe">
                Se souvenir de moi
              </label>
            </div>
            
            <button 
              type="submit" 
              class="btn btn-primary w-100 btn-login" 
              disabled={isLoading}
            >
              {#if isLoading}
                <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Vérification en cours...
              {:else}
                <i class="bi bi-arrow-right-circle me-2"></i>
                Continuer
              {/if}
            </button>
          </form>
        
        <!-- Étape 2 : Connexion utilisateur -->
        {:else if currentStep === LoginStep.USER}
          <form on:submit|preventDefault={handleUserLogin} class="mb-3">
            <div class="form-floating mb-3">
              <input 
                type="text" 
                class="form-control" 
                id="userLogin" 
                placeholder="Username"
                bind:value={userLogin}
                disabled={isLoading}
                required
              />
              <label for="userLogin">Username</label>
            </div>
            
            <div class="form-floating mb-4">
              <input 
                type="password" 
                class="form-control" 
                id="userPassword" 
                placeholder="Password"
                bind:value={userPassword}
                disabled={isLoading}
                required
              />
              <label for="userPassword">Password</label>
            </div>
            
            <div class="d-flex justify-content-between">
              <button 
                type="button" 
                class="btn btn-outline-secondary flex-grow-1 me-2" 
                on:click={goBack}
                disabled={isLoading}
              >
                <i class="bi bi-arrow-left me-2"></i>
                Retour
              </button>
              
              <button 
                type="submit" 
                class="btn btn-primary flex-grow-1 btn-login" 
                disabled={isLoading}
              >
                {#if isLoading}
                  <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Vérification...
                {:else}
                  <i class="bi bi-arrow-right-circle me-2"></i>
                  Continuer
                {/if}
              </button>
            </div>
          </form>
        
        <!-- Étape 3 : Sélection de campagne -->
        {:else if currentStep === LoginStep.CAMPAIGN}
          <form on:submit|preventDefault={handleCampaignSelection} class="mb-3">
            <div class="mb-4">
              <label for="campaignSelect" class="form-label fw-bold mb-2">Sélectionner une campagne</label>
              <select 
                id="campaignSelect" 
                class="form-select campaign-select" 
                bind:value={selectedCampaignId}
                required
              >
                <option value="" disabled selected>-- Sélectionner une campagne --</option>
                {#each campaigns as campaign}
                  {#if campaign.active !== false}
                    <option value={campaign.id}>{campaign.name}</option>
                  {/if}
                {/each}
              </select>
              
              {#if campaigns.length > 0 && selectedCampaignId}
                {#each campaigns.filter(c => c.id === selectedCampaignId) as selectedCampaign}
                  <div class="campaign-info mt-3 p-3 border rounded bg-light">
                    <h6 class="mb-2">Détails de la campagne:</h6>
                    <div><strong>ID:</strong> {selectedCampaign.id}</div>
                    <div><strong>Nom:</strong> {selectedCampaign.name}</div>
                    {#if selectedCampaign.description}
                      <div><strong>Description:</strong> {selectedCampaign.description}</div>
                    {/if}
                  </div>
                {/each}
              {/if}
            </div>
            
            <div class="d-flex justify-content-between">
              <button 
                type="button" 
                class="btn btn-outline-secondary flex-grow-1 me-2" 
                on:click={goBack}
                disabled={isLoading}
              >
                <i class="bi bi-arrow-left me-2"></i>
                Retour
              </button>
              
              <button 
                type="submit" 
                class="btn btn-primary flex-grow-1 btn-login" 
                disabled={isLoading}
              >
                {#if isLoading}
                  <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Connexion...
                {:else}
                  <i class="bi bi-box-arrow-in-right me-2"></i>
                  Se connecter
                {/if}
              </button>
            </div>
          </form>
        {/if}
      </div>
    </div>
    
    <!-- Footer -->
    <div class="text-center mt-4 text-muted small">
      <p>© {new Date().getFullYear()} McDial. All rights reserved.</p>
    </div>
  </div>
</div>

<style>
  /* Custom styling for the login page */
  .login-container {
    background: linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%);
    min-height: 100vh;
    padding: 2rem 1rem;
  }
  
  .login-card-wrapper {
    width: 100%;
    max-width: 500px;
  }
  
  .login-card {
    border-radius: 1rem;
    overflow: hidden;
    transition: all 0.3s ease;
    transform: translateY(0);
  }
  
  .login-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1) !important;
  }
  
  .logo-container {
    display: flex;
    justify-content: center;
    margin-bottom: 1.5rem;
  }
  
  .logo-circle {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2.5rem;
    font-weight: bold;
    color: white;
    box-shadow: 0 10px 20px rgba(0, 123, 255, 0.3);
    animation: pulse 2s infinite;
  }
  
  @keyframes pulse {
    0% {
      box-shadow: 0 0 0 0 rgba(0, 123, 255, 0.7);
    }
    70% {
      box-shadow: 0 0 0 15px rgba(0, 123, 255, 0);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(0, 123, 255, 0);
    }
  }
  
  /* Progress steps styling */
  .progress-steps {
    margin-bottom: 2rem;
  }
  
  .step-connector {
    flex-grow: 1;
    height: 2px;
    background-color: #dee2e6;
    margin: 0 10px;
    position: relative;
    top: 25px;
    max-width: 50px;
  }
  
  .step-circle {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background-color: #e9ecef;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 0.5rem;
    color: #6c757d;
    font-size: 1.25rem;
    transition: all 0.3s ease;
    border: 2px solid #dee2e6;
  }
  
  .step-item.active .step-circle {
    background-color: var(--bs-primary);
    color: white;
    border-color: var(--bs-primary);
    box-shadow: 0 0 0 5px rgba(0, 123, 255, 0.2);
  }
  
  .step-label {
    font-size: 0.875rem;
    color: #6c757d;
    font-weight: 500;
  }
  
  .step-item.active .step-label {
    color: var(--bs-primary);
    font-weight: 600;
  }
  
  /* Form styling */
  .btn-login {
    padding: 0.75rem 1.5rem;
    font-weight: 600;
    letter-spacing: 0.5px;
    transition: all 0.3s ease;
  }
  
  .btn-login:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 123, 255, 0.4);
  }
  
  .btn-login:active {
    transform: translateY(0);
  }
  
  /* Campaign select styling */
  .campaign-select {
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;
    border: 1px solid #dee2e6;
    background-color: #fff;
    transition: all 0.3s ease;
    font-size: 1rem;
    height: auto;
  }
  
  .campaign-select:focus {
    border-color: var(--bs-primary);
    box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
  }
</style>
