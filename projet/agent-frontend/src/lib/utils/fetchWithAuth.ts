/**
 * Utilitaire pour effectuer des requêtes API authentifiées pour l'interface agent
 * Cette fonction ajoute automatiquement le token d'authentification aux en-têtes
 * @param url - L'URL de l'API à appeler
 * @param options - Options de la requête fetch
 * @returns La réponse de l'API
 */
export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  // Récupérer le token depuis le localStorage
  const token = localStorage.getItem('agent_token');
  
  // Vérifier si l'utilisateur est authentifié
  if (!isAuthenticated()) {
    console.log('Utilisateur non authentifié lors d\'une requête API');
    
    // Rediriger vers la page de connexion si non authentifié et si nous ne sommes pas déjà sur cette page
    if (!window.location.pathname.includes('/login')) {
      console.log('Redirection vers la page de connexion');
      window.location.href = '/login';
    }
    throw new Error('Non authentifié');
  }
  
  // Préparer les en-têtes avec le token d'authentification si disponible
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Effectuer la requête avec les en-têtes d'authentification
  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Inclure les cookies dans la requête
  });
  
  // Gérer les erreurs d'authentification (401)
  if (response.status === 401) {
    console.log('Erreur d\'authentification 401 détectée');
    
    // Supprimer le token expiré et toutes les données d'authentification
    localStorage.removeItem('agent_token');
    localStorage.removeItem('phone_session_token');
    localStorage.removeItem('user_session_token');
    
    // Rediriger vers la page de connexion si nous ne sommes pas déjà sur cette page
    if (!window.location.pathname.includes('/login')) {
      console.log('Redirection vers la page de connexion suite à une erreur 401');
      window.location.href = '/login';
    }
  }
  
  return response;
}

/**
 * Vérifie si l'utilisateur est authentifié en vérifiant soit le token dans localStorage, soit les cookies
 * @returns true si l'utilisateur est authentifié, false sinon
 */
export function isAuthenticated(): boolean {
  // Vérifier le token dans localStorage
  const token = localStorage.getItem('agent_token');
  
  // Vérifier si le cookie JWT existe
  const cookies = document.cookie;
  const hasCookie = cookies.split(';').some(item => item.trim().startsWith('jwt='));
  
  console.log('Vérification d\'authentification:', { 
    hasToken: !!token, 
    hasCookie,
    cookies: cookies.length > 0 ? 'Présents' : 'Aucun cookie'
  });
  
  // L'utilisateur est authentifié s'il a soit un token, soit un cookie
  const isAuth = !!token || hasCookie;
  console.log('Utilisateur authentifié:', isAuth);
  return isAuth;
}

/**
 * Déconnecte l'utilisateur en supprimant son token et ses cookies
 */
export function logout(): void {
  // Supprimer tous les éléments du localStorage liés à l'authentification
  localStorage.removeItem('agent_token');
  localStorage.removeItem('agent_phone_login');
  
  // Supprimer tous les cookies liés à l'authentification
  const cookies = ['jwt', 'user_level', 'remember_agent'];
  cookies.forEach(cookieName => {
    // Supprimer pour le domaine principal
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    // Supprimer pour le domaine localhost
    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=localhost;`;
  });
  
  console.log('Déconnexion effectuée, redirection vers la page de connexion...');
  
  // Rediriger vers la page de connexion
  window.location.href = '/login';
}
