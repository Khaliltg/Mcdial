<script>
// @ts-nocheck
import '../app.css';
import Navbar from '$lib/components/Navbar.svelte';
import Sidebar from '$lib/components/Sidebar.svelte';
import Footer from '$lib/components/Footer.svelte';
import { page } from '$app/stores';
import { onMount } from 'svelte';
import { goto } from '$app/navigation';
import { authStore } from '$lib/stores/authStore';

let isSidebarOpen = false;
let isRedirecting = false;

function toggleSidebar() {
  isSidebarOpen = !isSidebarOpen;
}

$: isLoginOrHomePage = $page.url.pathname === '/login' || 
                            $page.url.pathname === '/' || 
                            $page.url.pathname === '/agent/login' || 
                            $page.url.pathname === '/admin/login';

// Gérer la redirection en fonction de l'authentification
onMount(() => {
  // Vérifier s'il y a un token dans localStorage
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');
  
  if (token && userStr) {
    try {
      const user = JSON.parse(userStr);
      console.log('Utilisateur connecté:', user);
      
      // Si l'utilisateur est sur une page de login mais qu'il est déjà connecté
      if (isLoginOrHomePage && !isRedirecting) {
        isRedirecting = true;
        
        // Rediriger vers le tableau de bord approprié
        if (user.user_level == 9 || user.role === 'admin') {
          console.log('Redirection vers le tableau de bord admin...');
          window.location.href = '/admin/dashboard';
        } else if (user.user_level == 1 || user.role === 'agent') {
          console.log('Redirection vers le tableau de bord agent...');
          window.location.href = '/agent/dashboard';
        }
      }
    } catch (err) {
      console.error('Erreur lors de la vérification de l\'authentification:', err);
    }
  }
});
</script>

<div class="d-flex flex-column min-vh-100">
  {#if !isLoginOrHomePage}
    <Navbar on:toggleSidebar={toggleSidebar} />
  {/if}

  <div class="container-fluid flex-grow-1 mt-5">
    <div class="row">
      {#if !isLoginOrHomePage}
        <div class="col-md-3 col-lg-2 d-md-block bg-light sidebar p-0">
          <Sidebar isOpen={isSidebarOpen} />
        </div>
      {/if}
      <main class={isLoginOrHomePage ? 'col-12' : 'col-md-9 ms-sm-auto col-lg-10 px-md-4 pt-3'}>
        <slot />
      </main>
    </div>
  </div>

  {#if !isLoginOrHomePage}
    <Footer />
  {/if}
</div>

<style>
  .sidebar {
    position: relative; ;
    top: -46px;
    bottom: 0;
    left: 0;
    z-index: 100;
    box-shadow: inset -1px 0 0 rgba(0, 0, 0, .1);
  }

  @media (max-width: 767.98px) {
    .sidebar {
      top: 0;
    }
  }
</style>