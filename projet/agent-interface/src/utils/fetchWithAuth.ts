// Importer l'URL de base de l'API depuis config.ts
import { getApiUrl } from './config';

// Configuration pour le backoff exponentiel
const RETRY_CONFIG = {
  maxRetries: 3,           // Nombre maximum de tentatives
  initialDelay: 1000,      // Délai initial en ms (1 seconde)
  maxDelay: 30000,         // Délai maximum en ms (30 secondes)
  backoffFactor: 2,        // Facteur de multiplication pour le backoff exponentiel
  statusCodesToRetry: [429, 503, 504] // Codes d'erreur HTTP à réessayer
};

// Création d'un objet API pour faciliter les appels
export const api = {
  get: (url: string, options: RequestInit = {}) => fetchWithAuth(url, { ...options, method: 'GET' }),
  post: (url: string, data: any, options: RequestInit = {}) => fetchWithAuth(url, { 
    ...options, 
    method: 'POST',
    body: JSON.stringify(data)
  }),
  put: (url: string, data: any, options: RequestInit = {}) => fetchWithAuth(url, { 
    ...options, 
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  delete: (url: string, options: RequestInit = {}) => fetchWithAuth(url, { ...options, method: 'DELETE' }),
}

// Fonction pour stocker le token d'authentification
export function setToken(token: string): void {
  console.log('Stockage du token d\'authentification...');
  // Utiliser le même nom de clé partout pour éviter les confusions
  localStorage.setItem("agent_token", token);
  localStorage.setItem("token", token); // Pour la compatibilité
  
  // Stocker également dans une session cookie pour plus de robustesse
  document.cookie = `auth_token=${token}; path=/; SameSite=Lax`;
  
  // Déboguer le stockage du token
  console.log('Token stocké dans localStorage:', localStorage.getItem("agent_token") ? 'Oui' : 'Non');
  console.log('Token stocké dans cookie:', document.cookie.includes('auth_token=') ? 'Oui' : 'Non');
}

// Fonction pour récupérer le token d'authentification
export function getToken(): string | null {
  // Vérifier toutes les sources possibles du token
  // 1. Essayer d'abord agent_token dans localStorage (notre clé principale)
  const agentToken = localStorage.getItem("agent_token");
  if (agentToken) {
    console.log('Token récupéré depuis localStorage (agent_token)');
    return agentToken;
  }
  
  // 2. Essayer token dans localStorage (clé alternative)
  const localToken = localStorage.getItem("token");
  if (localToken) {
    console.log('Token récupéré depuis localStorage (token)');
    // Synchroniser avec la clé principale
    localStorage.setItem("agent_token", localToken);
    return localToken;
  }
  
  // 3. Essayer de récupérer depuis les cookies
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'auth_token' && value) {
      console.log('Token récupéré depuis les cookies');
      // Synchroniser avec localStorage
      localStorage.setItem("agent_token", value);
      localStorage.setItem("token", value);
      return value;
    }
  }
  
  // 4. Essayer de récupérer depuis le cookie JWT (utilisé par le backend)
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'jwt' && value) {
      console.log('Token récupéré depuis le cookie JWT');
      // Synchroniser avec localStorage
      localStorage.setItem("agent_token", value);
      localStorage.setItem("token", value);
      return value;
    }
  }
  
  console.log('Aucun token d\'authentification trouvé');
  return null;
}

// Fonction pour effacer le token d'authentification
export function clearToken(): void {
  console.log('Suppression du token d\'authentification...');
  // Supprimer toutes les clés de token
  localStorage.removeItem("agent_token"); // Clé principale
  localStorage.removeItem("token"); // Clé alternative
  document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  
  // Supprimer les autres données liées à l'authentification
  localStorage.removeItem("campaign_id")
  localStorage.removeItem("full_name")
  localStorage.removeItem("agent_phone_login")
  localStorage.removeItem("sip_connection_state") // Supprimer l'état de connexion SIP
  
  // Supprimer les cookies
  document.cookie = "jwt=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
  document.cookie = "auth_success=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
  
  console.log('Tous les tokens et cookies ont été supprimés');
}

// Fonction pour vérifier si l'utilisateur est authentifié
export async function isAuthenticated(): Promise<boolean> {
  const token = getToken()
  if (!token) return false

  try {
    const response = await fetch(`${getApiUrl()}/agent/auth/verify-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
    })

    return response.ok
  } catch (error) {
    console.error("Erreur lors de la vérification de l'authentification:", error)
    return false
  }
}

// Fonction pour vérifier l'authentification et récupérer les informations de l'utilisateur
export async function checkAuth(): Promise<{ authenticated: boolean; user?: any; error?: string }> {
  const token = getToken()
  if (!token) {
    console.log('Aucun token d\'authentification trouvé');
    return { authenticated: false, error: 'Aucun token d\'authentification' }
  }

  try {
    console.log('Vérification du token d\'authentification...');
    
    // Vérifier si nous sommes sur la page de login pour éviter les boucles infinies
    const isLoginPage = window.location.pathname === '/login';
    
    // Utiliser un fetch simple sans retry pour la page de login
    const response = await fetch(`${getApiUrl()}/agent/info`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
    })

    if (response.ok) {
      const userData = await response.json()
      console.log('Informations utilisateur récupérées avec succès:', userData);
      return { authenticated: true, user: userData }
    } else {
      console.warn(`Échec de la vérification d'authentification: ${response.status}`);
      
      // Si le token est invalide (401), le supprimer pour éviter les boucles infinies
      if (response.status === 401) {
        console.warn('Token invalide ou expiré, suppression du token...');
        clearToken();
      }
      
      // Si nous sommes sur la page de login et que nous recevons une erreur 429,
      // ne pas continuer à réessayer pour éviter une boucle infinie
      if (isLoginPage && response.status === 429) {
        console.warn('Trop de requêtes sur la page de login. Attente de 10 secondes avant de réessayer.');
        // Attendre 10 secondes avant de permettre une nouvelle tentative
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
      
      try {
        // Essayer de lire le message d'erreur du serveur
        const errorData = await response.json();
        return { 
          authenticated: false, 
          error: errorData.message || `Erreur serveur (${response.status})` 
        }
      } catch (jsonError) {
        return { 
          authenticated: false, 
          error: `Erreur serveur (${response.status})` 
        }
      }
    }
  } catch (error) {
    console.error("Erreur lors de la vérification de l'authentification:", error)
    return { 
      authenticated: false, 
      error: error instanceof Error ? error.message : "Erreur de connexion au serveur" 
    }
  }
}

// Fonction utilitaire pour attendre un délai spécifié
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Fonction pour calculer le délai de backoff exponentiel
const calculateBackoff = (attempt: number): number => {
  const backoff = RETRY_CONFIG.initialDelay * Math.pow(RETRY_CONFIG.backoffFactor, attempt);
  return Math.min(backoff, RETRY_CONFIG.maxDelay);
};

// Fonction pour effectuer une requête authentifiée avec backoff exponentiel
export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken();

  if (!token) {
    throw new Error("Non authentifié");
  }

  const headers = new Headers(options.headers);
  headers.set("Authorization", `Bearer ${token}`);
  
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  // Ajouter un slash au début de l'URL si nécessaire
  const normalizedUrl = url.startsWith('/') ? url : `/${url}`;
  let fullUrl = url.startsWith("http") ? url : `${getApiUrl()}${normalizedUrl}`;
  
  // Vérifier si nous sommes sur la page de login pour éviter les boucles infinies
  const isLoginPage = window.location.pathname === '/login';
  
  // Si nous sommes sur la page de login, utiliser l'URL de login
  if (isLoginPage) {
    fullUrl = `${getApiUrl()}/agent/login`;
  }
  
  console.log(`Requête vers: ${fullUrl}`); // Ajout d'un log pour le débogage
  let lastResponse: Response | null = null;
  let attempt = 0;
  
  // Si nous sommes sur la page de login, limiter le nombre de tentatives à 1
  const maxRetries = isLoginPage ? 0 : RETRY_CONFIG.maxRetries;

  while (attempt <= maxRetries) {
    try {
      // Si ce n'est pas la première tentative, attendre selon le backoff exponentiel
      if (attempt > 0) {
        const backoffTime = calculateBackoff(attempt - 1);
        console.log(`Tentative ${attempt}/${maxRetries} pour ${fullUrl} - Attente de ${backoffTime}ms...`);
        await delay(backoffTime);
      }

      // Effectuer la requête
      lastResponse = await fetch(fullUrl, {
        ...options,
        headers,
        credentials: "include",
      });

      // Gérer les erreurs d'authentification immédiatement
      if (lastResponse.status === 401) {
        clearToken();
        window.location.href = "/login";
        throw new Error("Session expirée");
      }

      // Si c'est une erreur à réessayer (429, 503, 504), continuer la boucle
      if (lastResponse.status >= 500 || RETRY_CONFIG.statusCodesToRetry.includes(lastResponse.status)) {
        console.warn(`Erreur ${lastResponse.status} lors de la requête vers ${fullUrl}`);
        // Si nous sommes sur la page de login et que nous recevons une erreur 429,
        // ne pas continuer à réessayer pour éviter une boucle infinie
        if (isLoginPage && lastResponse.status === 429) {
          console.warn('Trop de requêtes sur la page de login. Pas de nouvelle tentative.');
          return lastResponse;
        }
        
        // Si c'est la dernière tentative, retourner la réponse même avec erreur
        if (attempt === maxRetries) {
          console.warn(`Échec après ${attempt} tentatives pour ${fullUrl}`);
          return lastResponse;
        }
        
        // Récupérer le header Retry-After s'il existe (pour 429)
        const retryAfter = lastResponse.headers.get('Retry-After');
        if (retryAfter) {
          const retryTime = parseInt(retryAfter) * 1000; // Convertir en ms
          console.log(`Header Retry-After détecté: attente de ${retryTime}ms`);
          await delay(retryTime);
          attempt++;
          continue;
        }
        
        // Sinon, passer à la tentative suivante avec backoff exponentiel
        attempt++;
        continue;
      }

      // Si la réponse est OK ou une erreur non retriable, la retourner immédiatement
      return lastResponse;
    } catch (error) {
      // En cas d'erreur réseau, réessayer si ce n'est pas la dernière tentative
      console.error(`Erreur réseau lors de la tentative ${attempt}:`, error);
      if (attempt === maxRetries) {
        throw error; // Relancer l'erreur si c'est la dernière tentative
      }
      attempt++;
    }
  }

  // Ce code ne devrait jamais être atteint, mais TypeScript l'exige
  return lastResponse!;
}

// Fonction pour se déconnecter
export async function logout(): Promise<void> {
  console.log('Début de la procédure de déconnexion');
  const token = getToken();
  console.log('Token trouvé:', token ? 'Oui' : 'Non');

  try {
    if (token) {
      // Rediriger vers l'API de déconnexion
      const logoutUrl = `${getApiUrl()}/agent/auth/logout`;
      console.log('URL de déconnexion:', logoutUrl);
      
      // Attendre la réponse du serveur avant de continuer
      try {
        console.log('Envoi de la requête de déconnexion au serveur...');
        const response = await fetch(logoutUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
        });
        
        console.log('Réponse du serveur reçue:', response.status);
        if (response.ok) {
          console.log('Déconnexion réussie côté serveur');
          const data = await response.json();
          console.log('Données de réponse:', data);
        } else {
          console.warn('Le serveur a retourné une erreur:', response.status);
          // Continuer malgré l'erreur pour assurer la déconnexion côté client
        }
      } catch (fetchError) {
        console.error("Erreur lors de l'appel API de déconnexion:", fetchError);
        // Continuer malgré l'erreur pour assurer la déconnexion côté client
      }
    }
  } catch (error) {
    console.error("Erreur générale lors de la déconnexion:", error);
  } finally {
    // Toujours nettoyer les tokens et rediriger, même en cas d'erreur
    console.log('Nettoyage des tokens et redirection...');
    clearToken();
    window.location.href = "/login";
  }
}
