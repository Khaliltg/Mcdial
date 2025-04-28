/**
 * Utilitaires d'authentification pour l'interface agent
 * Ces fonctions gèrent le processus d'authentification en 3 étapes
 */

import { goto } from '$app/navigation';
import { isAuthenticated, logout } from './fetchWithAuth';

// URL de base de l'API
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Vérifier si l'API est disponible
console.log(`Utilisation de l'API à l'adresse: ${API_BASE_URL}`);

/**
 * Étape 1: Authentification téléphonique
 * @param phoneLogin - Identifiant du téléphone
 * @param phonePassword - Mot de passe du téléphone
 * @returns Résultat de l'authentification téléphonique
 */
export async function phoneLogin(phoneLogin: string, phonePassword: string): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/agent/auth/phone-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phoneLogin, phonePassword }),
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erreur lors de l\'authentification téléphonique');
    }

    // Stocker le token de session téléphonique dans le localStorage
    localStorage.setItem('phone_session_token', data.phoneSessionToken);
    localStorage.setItem('agent_phone_login', phoneLogin);
    localStorage.setItem('agent_extension', data.extension);

    return data;
  } catch (error) {
    console.error('Erreur lors de l\'authentification téléphonique:', error);
    throw error;
  }
}

/**
 * Étape 2: Authentification utilisateur
 * @param userLogin - Identifiant de l'utilisateur
 * @param userPassword - Mot de passe de l'utilisateur
 * @returns Résultat de l'authentification utilisateur
 */
export async function userLogin(userLogin: string, userPassword: string): Promise<any> {
  try {
    const phoneSessionToken = localStorage.getItem('phone_session_token');
    
    if (!phoneSessionToken) {
      throw new Error('Session téléphonique expirée ou invalide');
    }

    const response = await fetch(`${API_BASE_URL}/api/agent/auth/user-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${phoneSessionToken}`,
      },
      body: JSON.stringify({ userLogin, userPassword }),
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erreur lors de l\'authentification utilisateur');
    }

    // Stocker le token de session utilisateur dans le localStorage
    localStorage.setItem('user_session_token', data.userSessionToken);
    localStorage.setItem('agent_user', userLogin);
    localStorage.setItem('agent_campaigns', JSON.stringify(data.campaigns));

    return data;
  } catch (error) {
    console.error('Erreur lors de l\'authentification utilisateur:', error);
    throw error;
  }
}

/**
 * Étape 3: Sélection de campagne
 * @param campaignId - ID de la campagne sélectionnée
 * @returns Résultat de la sélection de campagne
 */
export async function selectCampaign(campaignId: string): Promise<any> {
  try {
    const userSessionToken = localStorage.getItem('user_session_token');
    
    if (!userSessionToken) {
      throw new Error('Session utilisateur expirée ou invalide');
    }

    const response = await fetch(`${API_BASE_URL}/api/agent/auth/select-campaign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userSessionToken}`,
      },
      body: JSON.stringify({ campaignId }),
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erreur lors de la sélection de campagne');
    }

    // Stocker le token final dans le localStorage
    localStorage.setItem('agent_token', data.token);
    localStorage.setItem('agent_campaign', campaignId);
    
    // Vérifier si l'authentification a réussi
    const authenticated = isAuthenticated();
    console.log('Authentification complète:', { authenticated, token: !!data.token });
    
    // Forcer la redirection vers la page d'accueil sans vérification supplémentaire
    // car nous venons de recevoir le token et de le stocker
    console.log('Redirection forcée vers la page d\'accueil...');
    
    // Ajouter un petit délai pour s'assurer que le localStorage est bien mis à jour
    setTimeout(() => {
      // Utiliser window.location.href pour une redirection plus forte qui force un rechargement complet
      window.location.href = '/';
    }, 100);

    return data;
  } catch (error) {
    console.error('Erreur lors de la sélection de campagne:', error);
    throw error;
  }
}

/**
 * Vérifie le statut d'authentification et redirige si nécessaire
 * @param redirectToLogin - Si true, redirige vers la page de login si non authentifié
 * @returns true si authentifié, false sinon
 */
export function checkAuthStatus(redirectToLogin = true): boolean {
  const authenticated = isAuthenticated();
  
  if (!authenticated && redirectToLogin) {
    goto('/login');
  }
  
  return authenticated;
}

/**
 * Déconnecte l'utilisateur et redirige vers la page de login
 */
export function logoutAndRedirect(): void {
  logout();
  goto('/login');
}
