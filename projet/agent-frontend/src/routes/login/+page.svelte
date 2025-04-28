<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  
  // URL de base de l'API
  const API_BASE_URL = 'http://localhost:8000';
  
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
      const response = await fetch(`${API_BASE_URL}/api/agent/auth/phone-login`, {
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
      const response = await fetch(`${API_BASE_URL}/api/agent/auth/user-login`, {
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
      const apiUrl = `${API_BASE_URL}/api/agent/auth/select-campaign`;
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
          localStorage.setItem('agent_token', data.token);
          localStorage.setItem('agent_campaign_id', selectedCampaignId);
          localStorage.setItem('agent_full_name', data.full_name || '');
          
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
          
          // Utiliser window.location.href pour une redirection complète
          window.location.href = '/';
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

<div class="min-h-screen flex items-center justify-center bg-gray-100">
  <div class="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
    <div class="text-center mb-6">
      <h1 class="text-2xl font-bold text-gray-800">McDial Agent</h1>
      <p class="text-gray-600">
        {#if currentStep === LoginStep.PHONE}
          Étape 1/3 : Connexion téléphonique
        {:else if currentStep === LoginStep.USER}
          Étape 2/3 : Connexion utilisateur
        {:else}
          Étape 3/3 : Sélection de campagne
        {/if}
      </p>
    </div>
    
    {#if errorMessage}
      <div class="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
        {errorMessage}
      </div>
    {/if}
    
    <!-- Étape 1 : Connexion téléphonique -->
    {#if currentStep === LoginStep.PHONE}
      <form on:submit|preventDefault={handlePhoneLogin} class="space-y-4">
        <div>
          <label for="phone-login" class="block text-sm font-medium text-gray-700">Phone Login</label>
          <input
            type="text"
            id="phone-login"
            bind:value={phoneLogin}
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Identifiant téléphonique"
            disabled={isLoading}
            required
          />
        </div>
        
        <div>
          <label for="phone-password" class="block text-sm font-medium text-gray-700">Phone Password</label>
          <input
            type="password"
            id="phone-password"
            bind:value={phonePassword}
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Mot de passe téléphonique"
            disabled={isLoading}
            required
          />
        </div>
        
        <div class="flex items-center">
          <input
            type="checkbox"
            id="remember-me"
            bind:checked={rememberMe}
            class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label for="remember-me" class="ml-2 block text-sm text-gray-700">Se souvenir de moi</label>
        </div>
        
        <div>
          <button
            type="submit"
            class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {#if isLoading}
              <span class="mr-2">Vérification en cours...</span>
              <div class="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
            {:else}
              Continuer
            {/if}
          </button>
        </div>
      </form>
    
    <!-- Étape 2 : Connexion utilisateur -->
    {:else if currentStep === LoginStep.USER}
      <form on:submit|preventDefault={handleUserLogin} class="space-y-4">
        <div>
          <label for="user-login" class="block text-sm font-medium text-gray-700">User Login</label>
          <input
            type="text"
            id="user-login"
            bind:value={userLogin}
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Identifiant utilisateur"
            disabled={isLoading}
            required
          />
        </div>
        
        <div>
          <label for="user-password" class="block text-sm font-medium text-gray-700">User Password</label>
          <input
            type="password"
            id="user-password"
            bind:value={userPassword}
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Mot de passe utilisateur"
            disabled={isLoading}
            required
          />
        </div>
        
        <div class="flex justify-between space-x-3">
          <button
            type="button"
            on:click={goBack}
            class="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            Retour
          </button>
          
          <button
            type="submit"
            class="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {#if isLoading}
              <span class="mr-2">Vérification...</span>
              <div class="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
            {:else}
              Continuer
            {/if}
          </button>
        </div>
      </form>
    
    <!-- Étape 3 : Sélection de campagne -->
    {:else if currentStep === LoginStep.CAMPAIGN}
      <form on:submit|preventDefault={handleCampaignSelection} class="space-y-4">
        <div>
          <label for="campaign" class="block text-sm font-medium text-gray-700">Sélectionner une campagne</label>
          <select
            id="campaign"
            bind:value={selectedCampaignId}
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            disabled={isLoading}
            required
          >
            <option value="">-- Sélectionner une campagne --</option>
            {#each campaigns as campaign}
              {#if campaign.active}
                <option value={campaign.id}>{campaign.name}</option>
              {/if}
            {/each}
          </select>
        </div>
        
        <div class="flex justify-between space-x-3">
          <button
            type="button"
            on:click={goBack}
            class="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            Retour
          </button>
          
          <button
            type="submit"
            class="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {#if isLoading}
              <span class="mr-2">Connexion...</span>
              <div class="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
            {:else}
              Se connecter
            {/if}
          </button>
        </div>
      </form>
    {/if}
  </div>
</div>