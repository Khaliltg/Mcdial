<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  
  // Vérifier l'authentification pour les pages admin
  onMount(() => {
    // Ne pas vérifier l'authentification sur la page de login
    if ($page.url.pathname === '/admin/login') {
      return;
    }
    
    // Vérifier si l'utilisateur est connecté
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      console.log('Utilisateur non connecté, redirection vers login');
      goto('/admin/login');
      return;
    }
    
    try {
      const user = JSON.parse(userStr);
      // Vérifier si l'utilisateur est un administrateur (niveau 9)
      if (user.user_level != 9) {
        console.log('Niveau utilisateur insuffisant:', user.user_level);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        goto('/admin/login');
      }
    } catch (err) {
      console.error('Erreur lors de la vérification des droits:', err);
      goto('/admin/login');
    }
  });
</script>

<slot />
