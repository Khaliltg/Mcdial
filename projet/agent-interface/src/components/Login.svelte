<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { fade, fly, slide } from 'svelte/transition';
  import { agentState, connectAgentToAsterisk } from '../stores/agent';
  import { getToken, setToken, isAuthenticated, checkAuth } from '../utils/fetchWithAuth';
  import { getApiUrl } from '../utils/config';
  import { get } from 'svelte/store';
  
  // Étape actuelle du processus de connexion
  enum LoginStep {
    PHONE = 1,
    USER = 2,
    CAMPAIGN = 3
  }
  
  // Variables pour le formulaire de connexion téléphonique (étape 1)
  let phoneLogin = '';
  let phonePassword = '';
  let showPhonePassword = false;
  
  // Variables pour le formulaire de connexion utilisateur (étape 2)
  let userLogin = '';
  let userPassword = '';
  let showUserPassword = false;
  
  // Variables pour la sélection de campagne (étape 3)
  let selectedCampaignId = '';
  let campaigns: Campaign[] = [];
  let filteredCampaigns: Campaign[] = [];
  let searchQuery = '';
  
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
  let messageInterval: number;
  let animationDirection = 1; // 1 pour avancer, -1 pour reculer
  
  // Fonction pour filtrer les campagnes
  function filterCampaigns() {
    if (!searchQuery.trim()) {
      filteredCampaigns = campaigns.filter(c => c.active !== false);
    } else {
      const query = searchQuery.toLowerCase().trim();
      filteredCampaigns = campaigns.filter(c => 
        c.active !== false && 
        (c.name.toLowerCase().includes(query) || 
         (c.description && c.description.toLowerCase().includes(query))));
    }
  }

  // Fonction pour gérer la connexion téléphonique (étape 1)
  async function handlePhoneLogin() {
    if (!phoneLogin || !phonePassword) {
      errorMessage = 'Veuillez saisir votre identifiant et mot de passe téléphonique';
      return;
    }
    
    try {
      isLoading = true;
      errorMessage = '';
      animationDirection = 1;
      
      // Appel API au backend pour l'authentification téléphonique
      const response = await fetch(`${getApiUrl()}/agent/auth/phone-login`, {
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
          await tick();
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
    } catch (error: any) {
      console.error('Erreur de connexion téléphonique:', error);
      errorMessage = error.message || 'Une erreur est survenue lors de la connexion téléphonique';
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
      animationDirection = 1;
      
      // Appel API au backend pour l'authentification utilisateur
      const response = await fetch(`${getApiUrl()}/agent/auth/user-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${phoneSessionToken}`
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
        filteredCampaigns = campaigns.filter(c => c.active !== false);
        
        if (campaigns.length > 0) {
          // Passer à l'étape suivante (sélection de campagne)
          await tick();
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
    } catch (error: any) {
      console.error('Erreur de connexion utilisateur:', error);
      errorMessage = error.message || 'Une erreur est survenue lors de la connexion utilisateur';
    } finally {
      isLoading = false;
    }
  }
  
  // Fonction pour sélectionner une campagne
  function selectCampaign(campaignId: string) {
    selectedCampaignId = campaignId;
  }

  // Fonction pour finaliser la connexion avec la sélection de campagne (étape 3)
  async function handleCampaignSelection() {
    if (!selectedCampaignId) {
      errorMessage = 'Veuillez sélectionner une campagne';
      return;
    }
    
    try {
      isLoading = true;
      errorMessage = '';
      console.log('Début de la sélection de campagne');
      console.log('Campagne sélectionnée:', selectedCampaignId);
      
      // Afficher des messages de progression pour les opérations longues
      let progressMessages = [
        'Connexion en cours...',
        'Configuration de votre environnement...',
        'Synchronisation avec le système téléphonique...',
        'Finalisation de votre session...'
      ];
      
      let messageIndex = 0;
      
      // Mettre à jour le message de chargement périodiquement
      messageInterval = window.setInterval(() => {
        if (messageIndex < progressMessages.length) {
          // Mettre à jour le message de chargement
          console.log('Message de progression:', progressMessages[messageIndex]);
          messageIndex++;
        }
      }, 2000);
      
      // Préparer les données pour l'appel API
      const requestBody = { campaignId: selectedCampaignId };
      
      // Appel API au backend pour finaliser la connexion avec la campagne sélectionnée
      console.log('Requête de sélection de campagne:', {
        url: `${getApiUrl()}/agent/auth/select-campaign`,
        requestBody: requestBody,
        headers: {
          'Authorization': `Bearer ${userSessionToken.substring(0, 10) + '...'}`
        }
      });
      
      const response = await fetch(`${getApiUrl()}/agent/auth/select-campaign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userSessionToken}`
        },
        body: JSON.stringify(requestBody),
        credentials: 'include'
      });
      
      console.log('Réponse de sélection de campagne:', {
        status: response.status,
        ok: response.ok
      });
      
      // Tenter de lire le corps de la réponse
      const responseText = await response.text();
      console.log('Réponse texte reçue du serveur:', responseText.substring(0, 100) + '...');
      let data;
      
      try {
        // Convertir la réponse texte en JSON
        data = JSON.parse(responseText);
        console.log('Données JSON parsées:', data);
        console.log('Token reçu dans la réponse:', data.token ? 'OUI' : 'NON');
        if (data.token) {
          console.log('Token reçu (début):', data.token.substring(0, 20) + '...');
        }
      } catch (jsonError) {
        console.error('Erreur de parsing JSON:', jsonError);
        console.error('Texte de réponse problématique:', responseText);
        errorMessage = 'Format de réponse invalide du serveur';
        isLoading = false;
        return;
      }
      
      if (response.ok && data) {
        console.log('Réponse OK, données reçues:', Object.keys(data));
        // Stocker le token final
        if (data.token) {
          console.log('Token trouvé dans la réponse, stockage...');
          // Stocker le token dans le service d'authentification
          setToken(data.token);
          
          // Stocker les informations de l'agent
          localStorage.setItem('campaign_id', selectedCampaignId);
          
          // Mettre à jour l'état de l'agent
          agentState.update(state => ({
            ...state,
            user: data.user,
            fullName: data.full_name,
            extension: data.extension,
            phoneLogin: data.phone_login,
            campaignId: selectedCampaignId,
            campaignName: data.campaign?.name || '',
            isAuthenticated: true
          }));
          
          // Démarrer la synchronisation avec Asterisk en arrière-plan
          console.log('Démarrage de la synchronisation avec Asterisk en arrière-plan...');
          
          // Lancer la synchronisation en arrière-plan sans attendre
          setTimeout(() => {
            connectAgentToAsterisk(phonePassword)
              .then(syncResult => {
                console.log('Résultat de la synchronisation avec Asterisk (en arrière-plan):', syncResult);
                if (!syncResult.success) {
                  console.warn('Avertissement: Synchronisation avec Asterisk échouée:', syncResult.message);
                }
              })
              .catch(syncError => {
                console.error('Erreur lors de la synchronisation avec Asterisk (en arrière-plan):', syncError);
              });
          }, 1000); // Démarrer après 1 seconde pour laisser le temps à la redirection
          
          // Mettre à jour le store agentState avec les données de l'utilisateur
          agentState.update(state => ({
            ...state,
            isAuthenticated: true,
            user: data.user,
            fullName: data.full_name,
            extension: data.extension,
            phoneLogin: data.phone_login || '',
            campaignId: selectedCampaignId,
            campaignName: data.campaign?.name || 'Campagne ' + selectedCampaignId
          }));
          
          // Gérer l'option "Se souvenir de moi"
          if (rememberMe) {
            localStorage.setItem('agent_phone_login', phoneLogin);
            document.cookie = 'remember_agent=true; max-age=2592000; path=/;'; // 30 jours
          } else {
            localStorage.removeItem('agent_phone_login');
            document.cookie = 'remember_agent=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
          }
          
          console.log('Authentification réussie, redirection vers le dashboard...');
          
          // Vérifier que le token est bien stocké avant de rediriger
          const storedToken = getToken();
          if (storedToken) {
            console.log('Token vérifié avant redirection: Présent');
            // Rediriger vers la page principale
            window.location.href = '/';
          } else {
            console.warn('Token non trouvé, tentative de stockage manuel...');
            setToken(data.token);
            // Forcer un rechargement complet de la page après un court délai
            setTimeout(() => window.location.href = '/', 100);
          }
        } else {
          console.error('Token final non reçu du serveur');
          errorMessage = 'Token d\'authentification non reçu du serveur';
        }
      } else {
        // Gérer les différents codes d'erreur
        if (data && data.message) {
          errorMessage = data.message || 'Échec de la sélection de campagne';
        } else {
          errorMessage = `Échec de la sélection de campagne (${response.status})`;
        }
      }
    } catch (error: any) {
      console.error('Erreur lors de la sélection de campagne:', error);
      errorMessage = error.message || 'Une erreur est survenue lors de la sélection de campagne';
      
      // Afficher un message d'erreur plus détaillé
      if (error.message && error.message.includes('SIP')) {
        errorMessage = 'Problème de connexion SIP. Vérifiez que votre softphone (Zoiper) est bien connecté et enregistré.';
      }
    } finally {
      // Nettoyer l'intervalle de messages
      if (typeof messageInterval !== 'undefined') {
        window.clearInterval(messageInterval);
      }
      isLoading = false;
    }
  }
  
  // Fonction pour revenir à l'étape précédente
  function goBack() {
    animationDirection = -1;
    errorMessage = '';
    
    if (currentStep === LoginStep.USER) {
      currentStep = LoginStep.PHONE;
      phoneSessionToken = '';
      userSessionToken = '';
    } else if (currentStep === LoginStep.CAMPAIGN) {
      currentStep = LoginStep.USER;
      userSessionToken = '';
      selectedCampaignId = '';
    }
  }
  
  onMount(async () => {
    // Vérifier si l'utilisateur est déjà authentifié
    const authenticated = await isAuthenticated();
    
    // Vérifier d'abord si l'utilisateur est déjà authentifié
    const token = getToken();
    if (token) {
      console.log('Token trouvé, vérification de la validité...');
      
      try {
        // Vérifier si le token est valide
        const authResult = await checkAuth();
        
        if (authResult.authenticated && authResult.user) {
          console.log('Utilisateur déjà authentifié, redirection vers la page d\'accueil...');
          
          // Mettre à jour le store agentState
          agentState.update(state => ({
            ...state,
            isAuthenticated: true,
            user: authResult.user.user,
            fullName: authResult.user.full_name,
            phoneLogin: authResult.user.phone_login || '',
            extension: authResult.user.extension,
            campaignId: authResult.user.campaign_id || '',
            campaignName: authResult.user.campaign_name || ''
          }));
          
          // Rediriger vers la page d'accueil
          window.location.href = '/';
          return;
        } else {
          console.log('Token invalide ou expiré, affichage du formulaire de connexion');
        }
      } catch (error) {
        console.error('Erreur lors de la vérification du token:', error);
      }
    }
    
    // Vérifier si l'utilisateur a choisi "Se souvenir de moi" précédemment
    const savedPhoneLogin = localStorage.getItem('agent_phone_login');
    
    const hasRememberCookie = document.cookie.split(';').some(item => item.trim().startsWith('remember_agent='));
    
    if (savedPhoneLogin && hasRememberCookie) {
      phoneLogin = savedPhoneLogin;
      rememberMe = true;
    }
  });
</script>

<div class="login-container">
  <div class="login-card-wrapper">
    <div class="login-card" in:fade={{ duration: 300 }}>
      <!-- Left side with visual elements -->
      <div class="login-visual">
        <div class="visual-background">
          <div class="animated-waves"></div>
        </div>
        <div class="visual-content">
          <div class="brand-logo">
            <div class="logo-circle">M</div>
          </div>
          <h1 class="welcome-text">Bienvenue sur McDial</h1>
          <p class="welcome-subtext">Votre plateforme de téléphonie intelligente</p>
          <div class="illustration">
            <i class="bi bi-headset"></i>
          </div>
        </div>
      </div>
      
      <!-- Right side with form -->
      <div class="login-form-side">
        <!-- Mobile logo (visible only on small screens) -->
        <div class="mobile-header">
          <div class="brand-logo-mobile">
            <div class="logo-circle">M</div>
          </div>
          <h2>McDial Agent</h2>
        </div>
        
        <div class="login-form-container">
          <h3 class="login-title">
            {#if currentStep === LoginStep.PHONE}
              <i class="bi bi-telephone-fill step-icon"></i> Connexion téléphonique
            {:else if currentStep === LoginStep.USER}
              <i class="bi bi-person-fill step-icon"></i> Connexion utilisateur
            {:else}
              <i class="bi bi-megaphone-fill step-icon"></i> Sélection de campagne
            {/if}
          </h3>
          
          <!-- Progress steps -->
          <div class="progress-container">
            <div class="progress-bar">
              <div class="progress-fill" style="width: {(currentStep - 1) * 50}%"></div>
            </div>
            <div class="progress-steps">
              <div class="step-item {currentStep >= LoginStep.PHONE ? 'active' : ''}">
                <div class="step-circle">
                  {#if currentStep > LoginStep.PHONE}
                    <i class="bi bi-check-lg"></i>
                  {:else}
                    <i class="bi bi-telephone"></i>
                  {/if}
                </div>
                <div class="step-label">Téléphone</div>
              </div>
              
              <div class="step-item {currentStep >= LoginStep.USER ? 'active' : ''}">
                <div class="step-circle">
                  {#if currentStep > LoginStep.USER}
                    <i class="bi bi-check-lg"></i>
                  {:else}
                    <i class="bi bi-person"></i>
                  {/if}
                </div>
                <div class="step-label">Utilisateur</div>
              </div>
              
              <div class="step-item {currentStep >= LoginStep.CAMPAIGN ? 'active' : ''}">
                <div class="step-circle">
                  <i class="bi bi-megaphone"></i>
                </div>
                <div class="step-label">Campagne</div>
              </div>
            </div>
          </div>
          
          {#if errorMessage}
            <div class="error-message" in:fly={{ y: 20, duration: 300 }} out:fade>
              <i class="bi bi-exclamation-triangle-fill"></i>
              <span>{errorMessage}</span>
              <button type="button" class="close-btn" aria-label="Close" on:click={() => errorMessage = ''}>
                <i class="bi bi-x"></i>
              </button>
            </div>
          {/if}
          
          <!-- Étape 1 : Connexion téléphonique -->
          {#if currentStep === LoginStep.PHONE}
            <div class="form-wrapper" in:fly={{ x: animationDirection * 30, duration: 300, delay: 100 }}>
              <form on:submit|preventDefault={handlePhoneLogin}>
                <div class="form-group">
                  <label for="phoneLogin">Identifiant téléphonique</label>
                  <div class="input-wrapper">
                    <i class="bi bi-telephone input-icon"></i>
                    <input 
                      type="text" 
                      id="phoneLogin" 
                      placeholder="Entrez votre identifiant téléphonique"
                      bind:value={phoneLogin}
                      disabled={isLoading}
                      required
                    />
                  </div>
                </div>
                
                <div class="form-group">
                  <label for="phonePassword">Mot de passe téléphonique</label>
                  <div class="input-wrapper">
                    <i class="bi bi-lock input-icon"></i>
                    {#if showPhonePassword}
                      <input 
                        type="text"
                        id="phonePassword" 
                        placeholder="Entrez votre mot de passe téléphonique"
                        bind:value={phonePassword}
                        disabled={isLoading}
                        required
                      />
                    {:else}
                      <input 
                        type="password"
                        id="phonePassword" 
                        placeholder="Entrez votre mot de passe téléphonique"
                        bind:value={phonePassword}
                        disabled={isLoading}
                        required
                      />
                    {/if}
                    <button 
                      type="button" 
                      class="password-toggle" 
                      on:click={() => showPhonePassword = !showPhonePassword}
                    >
                      <i class="bi {showPhonePassword ? 'bi-eye-slash' : 'bi-eye'}"></i>
                    </button>
                  </div>
                </div>
                
                <div class="remember-me">
                  <label class="checkbox-container">
                    <input 
                      type="checkbox" 
                      id="rememberMe"
                      bind:checked={rememberMe}
                    />
                    <span class="checkmark"></span>
                    <span>Se souvenir de moi</span>
                  </label>
                </div>
                
                <button 
                  type="submit" 
                  class="btn-primary" 
                  disabled={isLoading}
                >
                  {#if isLoading}
                    <div class="spinner"></div>
                    <span>Vérification en cours...</span>
                  {:else}
                    <span>Continuer</span>
                    <i class="bi bi-arrow-right"></i>
                  {/if}
                </button>
              </form>
            </div>
          
          <!-- Étape 2 : Connexion utilisateur -->
          {:else if currentStep === LoginStep.USER}
            <div class="form-wrapper" in:fly={{ x: animationDirection * 30, duration: 300, delay: 100 }}>
              <form on:submit|preventDefault={handleUserLogin}>
                <div class="form-group">
                  <label for="userLogin">Nom d'utilisateur</label>
                  <div class="input-wrapper">
                    <i class="bi bi-person input-icon"></i>
                    <input 
                      type="text" 
                      id="userLogin" 
                      placeholder="Entrez votre nom d'utilisateur"
                      bind:value={userLogin}
                      disabled={isLoading}
                      required
                    />
                  </div>
                </div>
                
                <div class="form-group">
                  <label for="userPassword">Mot de passe</label>
                  <div class="input-wrapper">
                    <i class="bi bi-lock input-icon"></i>
                    {#if showUserPassword}
                      <input 
                        type="text"
                        id="userPassword" 
                        placeholder="Entrez votre mot de passe"
                        bind:value={userPassword}
                        disabled={isLoading}
                        required
                      />
                    {:else}
                      <input 
                        type="password"
                        id="userPassword" 
                        placeholder="Entrez votre mot de passe"
                        bind:value={userPassword}
                        disabled={isLoading}
                        required
                      />
                    {/if}
                    <button 
                      type="button" 
                      class="password-toggle" 
                      on:click={() => showUserPassword = !showUserPassword}
                    >
                      <i class="bi {showUserPassword ? 'bi-eye-slash' : 'bi-eye'}"></i>
                    </button>
                  </div>
                </div>
                
                <div class="button-group">
                  <button 
                    type="button" 
                    class="btn-secondary" 
                    on:click={goBack}
                    disabled={isLoading}
                  >
                    <i class="bi bi-arrow-left"></i>
                    <span>Retour</span>
                  </button>
                  
                  <button 
                    type="submit" 
                    class="btn-primary" 
                    disabled={isLoading}
                  >
                    {#if isLoading}
                      <div class="spinner"></div>
                      <span>Vérification...</span>
                    {:else}
                      <span>Continuer</span>
                      <i class="bi bi-arrow-right"></i>
                    {/if}
                  </button>
                </div>
              </form>
            </div>
          
          <!-- Étape 3 : Sélection de campagne -->
          {:else if currentStep === LoginStep.CAMPAIGN}
            <div class="form-wrapper" in:fly={{ x: animationDirection * 30, duration: 300, delay: 100 }}>
              <form on:submit|preventDefault={handleCampaignSelection}>
                <div class="form-group">
                  <label for="campaignSearch">Rechercher une campagne</label>
                  <div class="input-wrapper">
                    <i class="bi bi-search input-icon"></i>
                    <input 
                      type="text" 
                      id="campaignSearch" 
                      placeholder="Rechercher par nom ou description"
                      bind:value={searchQuery}
                      on:input={filterCampaigns}
                      disabled={isLoading}
                    />
                  </div>
                </div>
                
                <div class="campaigns-container">
                  {#if filteredCampaigns.length > 0}
                    {#each filteredCampaigns as campaign}
                      <div 
                        class="campaign-card {selectedCampaignId === campaign.id ? 'selected' : ''}"
                        on:click={() => selectCampaign(campaign.id)}
                        on:keydown={(e) => e.key === 'Enter' && selectCampaign(campaign.id)}
                        tabindex="0"
                        role="button"
                      >
                        <div class="campaign-icon">
                          <i class="bi bi-megaphone"></i>
                        </div>
                        <div class="campaign-details">
                          <h4>{campaign.name}</h4>
                          {#if campaign.description}
                            <p>{campaign.description}</p>
                          {/if}
                        </div>
                        <div class="campaign-check">
                          {#if selectedCampaignId === campaign.id}
                            <i class="bi bi-check-circle-fill"></i>
                          {:else}
                            <i class="bi bi-circle"></i>
                          {/if}
                        </div>
                      </div>
                    {/each}
                  {:else}
                    <div class="no-campaigns">
                      <i class="bi bi-search"></i>
                      <p>Aucune campagne trouvée</p>
                    </div>
                  {/if}
                </div>
                
                <div class="button-group">
                  <button 
                    type="button" 
                    class="btn-secondary" 
                    on:click={goBack}
                    disabled={isLoading}
                  >
                    <i class="bi bi-arrow-left"></i>
                    <span>Retour</span>
                  </button>
                  
                  <button 
                    type="submit" 
                    class="btn-primary" 
                    disabled={isLoading || !selectedCampaignId}
                  >
                    {#if isLoading}
                      <div class="spinner"></div>
                      <span>Connexion...</span>
                    {:else}
                      <span>Se connecter</span>
                      <i class="bi bi-box-arrow-in-right"></i>
                    {/if}
                  </button>
                </div>
              </form>
            </div>
          {/if}
          
          <!-- Footer -->
          <div class="login-footer">
            <p>© {new Date().getFullYear()} McDial. Tous droits réservés.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  /* Base styles */
  :global(body) {
    font-family: 'Inter', 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }
  
  /* Container styles */
  .login-container {
    background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%234361ee' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
    min-height: 100vh;
    padding: 2rem 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .login-card-wrapper {
    width: 100%;
    max-width: 1100px;
    margin: 0 auto;
  }
  
  .login-card {
    display: flex;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 15px 50px rgba(0, 0, 0, 0.15);
    background-color: white;
    height: 600px;
    max-height: 90vh;
  }
  
  /* Left side with visual elements */
  .login-visual {
    flex: 0 0 33%;
    position: relative;
    overflow: hidden;
    background: linear-gradient(145deg, #4361ee 0%, #7209b7 100%);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .visual-background {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    overflow: hidden;
  }
  
  .animated-waves {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: url("data:image/svg+xml,%3Csvg width='100%25' height='100%25' viewBox='0 0 1200 800' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3ClinearGradient id='a' gradientUnits='userSpaceOnUse' x1='600' y1='25' x2='600' y2='777'%3E%3Cstop offset='0' stop-color='%23ffffff' stop-opacity='0.3'/%3E%3Cstop offset='1' stop-color='%23ffffff' stop-opacity='0'/%3E%3C/linearGradient%3E%3ClinearGradient id='b' gradientUnits='userSpaceOnUse' x1='650' y1='25' x2='650' y2='777'%3E%3Cstop offset='0' stop-color='%23ffffff' stop-opacity='0.2'/%3E%3Cstop offset='1' stop-color='%23ffffff' stop-opacity='0'/%3E%3C/linearGradient%3E%3ClinearGradient id='c' gradientUnits='userSpaceOnUse' x1='700' y1='25' x2='700' y2='777'%3E%3Cstop offset='0' stop-color='%23ffffff' stop-opacity='0.1'/%3E%3Cstop offset='1' stop-color='%23ffffff' stop-opacity='0'/%3E%3C/linearGradient%3E%3C/defs%3E%3Cpath d='M0,0L24,42.7C48,85,96,171,144,202.7C192,235,240,213,288,202.7C336,192,384,192,432,213.3C480,235,528,277,576,277.3C624,277,672,235,720,192C768,149,816,107,864,122.7C912,139,960,213,1008,218.7C1056,224,1104,160,1152,117.3C1200,75,1248,53,1296,69.3C1344,85,1392,139,1416,165.3L1440,192L1440,320L1416,320C1392,320,1344,320,1296,320C1248,320,1200,320,1152,320C1104,320,1056,320,1008,320C960,320,912,320,864,320C816,320,768,320,720,320C672,320,624,320,576,320C528,320,480,320,432,320C384,320,336,320,288,320C240,320,192,320,144,320C96,320,48,320,24,320L0,320Z' fill='url(%23a)'/%3E%3Cpath d='M0,0L24,42.7C48,85,96,171,144,202.7C192,235,240,213,288,202.7C336,192,384,192,432,213.3C480,235,528,277,576,277.3C624,277,672,235,720,192C768,149,816,107,864,122.7C912,139,960,213,1008,218.7C1056,224,1104,160,1152,117.3C1200,75,1248,53,1296,69.3C1344,85,1392,139,1416,165.3L1440,192L1440,320L1416,320C1392,320,1344,320,1296,320C1248,320,1200,320,1152,320C1104,320,1056,320,1008,320C960,320,912,320,864,320C816,320,768,320,720,320C672,320,624,320,576,320C528,320,480,320,432,320C384,320,336,320,288,320C240,320,192,320,144,320C96,320,48,320,24,320L0,320Z' transform='translate(0, 100)' fill='url(%23b)'/%3E%3Cpath d='M0,0L24,42.7C48,85,96,171,144,202.7C192,235,240,213,288,202.7C336,192,384,192,432,213.3C480,235,528,277,576,277.3C624,277,672,235,720,192C768,149,816,107,864,122.7C912,139,960,213,1008,218.7C1056,224,1104,160,1152,117.3C1200,75,1248,53,1296,69.3C1344,85,1392,139,1416,165.3L1440,192L1440,320L1416,320C1392,320,1344,320,1296,320C1248,320,1200,320,1152,320C1104,320,1056,320,1008,320C960,320,912,320,864,320C816,320,768,320,720,320C672,320,624,320,576,320C528,320,480,320,432,320C384,320,336,320,288,320C240,320,192,320,144,320C96,320,48,320,24,320L0,320Z' transform='translate(0, 200)' fill='url(%23c)'/%3E%3C/svg%3E");
    background-size: 100% 100%;
    opacity: 0.6;
    animation: wave 20s linear infinite;
  }
  
  @keyframes wave {
    0% {
      background-position: 0% 0%;
    }
    100% {
      background-position: 100% 0%;
    }
  }
  
  .visual-content {
    position: relative;
    z-index: 2;
    text-align: center;
    color: white;
    padding: 2rem;
  }
  
  .brand-logo {
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
    background: linear-gradient(45deg, #f72585, #7209b7);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
    position: relative;
    overflow: hidden;
  }
  
  .logo-circle::after {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%);
    transform: rotate(45deg);
  }
  
  .welcome-text {
    font-size: 2.2rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
    text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  }
  
  .welcome-subtext {
    font-size: 1.1rem;
    opacity: 0.9;
    margin-bottom: 2rem;
  }
  
  .illustration {
    margin-top: 2rem;
  }
  
  .illustration i {
    font-size: 5rem;
    opacity: 0.8;
    color: rgba(255, 255, 255, 0.9);
    text-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  }
  
  /* Right side with form */
  .login-form-side {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
  }
  
  .mobile-header {
    display: none;
    text-align: center;
    padding: 1.5rem 0;
  }
  
  .brand-logo-mobile {
    display: flex;
    justify-content: center;
    margin-bottom: 0.5rem;
  }
  
  .mobile-header h2 {
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0.5rem 0 0;
  }
  
  .login-form-container {
    padding: 2.5rem 3rem;
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  
  .login-title {
    font-size: 1.8rem;
    font-weight: 600;
    color: #333;
    margin-bottom: 2rem;
    display: flex;
    align-items: center;
  }
  
  .step-icon {
    margin-right: 0.75rem;
    color: #4361ee;
  }
 
 /* Progress steps styling */
 .progress-container {
   position: relative;
   margin-bottom: 2rem;
 }
 
 .progress-bar {
   height: 4px;
   background-color: #e9ecef;
   border-radius: 2px;
   margin-bottom: 1.5rem;
   position: relative;
   z-index: 1;
 }
 
 .progress-fill {
   position: absolute;
   top: 0;
   left: 0;
   height: 100%;
   background: linear-gradient(to right, #1a56db, #4f46e5);
   border-radius: 2px;
   transition: width 0.5s ease;
 }
 
 .progress-steps {
   display: flex;
   justify-content: space-between;
   position: relative;
   z-index: 2;
 }
 
 .step-item {
   display: flex;
   flex-direction: column;
   align-items: center;
   position: relative;
   width: 33.333%;
 }
 
 .step-circle {
   width: 36px;
   height: 36px;
   border-radius: 50%;
   background-color: white;
   display: flex;
   align-items: center;
   justify-content: center;
   margin-bottom: 0.5rem;
   color: #6c757d;
   font-size: 0.9rem;
   font-weight: 600;
   transition: all 0.3s ease;
   border: 2px solid #e9ecef;
   position: relative;
   top: -20px;
 }
 
 .step-item.active .step-circle {
   background: linear-gradient(45deg, #1a56db, #4f46e5);
   color: white;
   border-color: white;
   transform: scale(1.1);
   box-shadow: 0 0 0 5px rgba(26, 86, 219, 0.2);
 }
 
 .step-label {
   font-size: 0.85rem;
   color: #6c757d;
   font-weight: 500;
   transition: all 0.3s ease;
   text-align: center;
 }
 
 .step-item.active .step-label {
   color: #1a56db;
   font-weight: 600;
 }
 
 /* Form styling */
 .form-group {
   margin-bottom: 1.5rem;
 }
 
 .form-label {
   font-weight: 500;
   margin-bottom: 0.5rem;
   color: #495057;
 }
 
 .input-group {
   border-radius: 8px;
   overflow: hidden;
   box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
   transition: all 0.3s ease;
 }
 
 .input-group:focus-within {
   box-shadow: 0 0 0 3px rgba(26, 86, 219, 0.25);
 }
 
 .input-group-text {
   background-color: #f8f9fa;
   border: 1px solid #ced4da;
   border-right: none;
   color: #6c757d;
   padding-left: 1rem;
   padding-right: 1rem;
 }
 
 .custom-input {
   border-radius: 0 8px 8px 0;
   padding: 0.75rem 1rem;
   border: 1px solid #ced4da;
   border-left: none;
   transition: all 0.3s ease;
   font-size: 1rem;
 }
 
 .custom-input:focus {
   border-color: #1a56db;
   box-shadow: none;
   outline: none;
 }
 
 .btn-login {
   border-radius: 8px;
   padding: 0.75rem 1.5rem;
   font-weight: 600;
   letter-spacing: 0.5px;
   transition: all 0.3s ease;
   background: linear-gradient(45deg, #1a56db, #4f46e5);
   border: none;
 }
 
 .btn-login:hover {
   transform: translateY(-2px);
   box-shadow: 0 5px 15px rgba(26, 86, 219, 0.4);
   background: linear-gradient(45deg, #164fc6, #4338ca);
 }
 
 .btn-login:active {
   transform: translateY(0);
 }
 
 /* Campaign select styling */
 .campaign-select {
   padding: 0.75rem 1rem;
   border-radius: 0 8px 8px 0;
   border: 1px solid #ced4da;
   border-left: none;
   background-color: #fff;
   transition: all 0.3s ease;
   font-size: 1rem;
   height: auto;
 }
 
 .campaign-select:focus {
   border-color: #1a56db;
   box-shadow: none;
   outline: none;
 }
 
 .campaign-info {
   background-color: #f0f4ff;
   border-radius: 8px;
   border: 1px solid #d1defa;
   color: #1a56db;
 }
 
 /* Responsive adjustments */
 @media (max-width: 991.98px) {
   .login-card-wrapper {
     max-width: 500px;
   }
   
   .login-card {
     box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
   }
   
   .logo-circle {
     width: 60px;
     height: 60px;
     font-size: 1.8rem;
   }
 }
</style>
