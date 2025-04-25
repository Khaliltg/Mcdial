import { writable } from 'svelte/store';

// Créer un store pour l'état d'authentification
const createAuthStore = () => {
  // Initialiser le store à partir de localStorage si disponible
  const initialValue = {
    isAuthenticated: false,
    user: null,
    token: null,
    userLevel: null
  };
  
  // Essayer de récupérer les données d'authentification du localStorage
  if (typeof window !== 'undefined') {
    try {
      const storedUser = localStorage.getItem('user');
      const storedToken = localStorage.getItem('token');
      const storedUserLevel = localStorage.getItem('user_level');
      
      if (storedUser && storedToken) {
        initialValue.isAuthenticated = true;
        initialValue.user = JSON.parse(storedUser);
        initialValue.token = storedToken;
        initialValue.userLevel = storedUserLevel;
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des données d\'authentification:', error);
    }
  }
  
  const { subscribe, set, update } = writable(initialValue);
  
  return {
    subscribe,
    
    // Méthode pour définir l'utilisateur connecté
    login: (userData, token, userLevel) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', token);
        localStorage.setItem('user_level', userLevel);
      }
      
      set({
        isAuthenticated: true,
        user: userData,
        token,
        userLevel
      });
    },
    
    // Méthode pour déconnecter l'utilisateur
    logout: () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('user_level');
        
        // Supprimer les cookies
        document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = 'token_js=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = 'user_level=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      }
      
      set({
        isAuthenticated: false,
        user: null,
        token: null,
        userLevel: null
      });
    }
  };
};

// Exporter le store
export const authStore = createAuthStore();
