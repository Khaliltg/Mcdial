<script>
  // @ts-nocheck
  
  import { createEventDispatcher } from 'svelte';
  
  let isMenuOpen = false;
  const dispatch = createEventDispatcher();
  
  function toggleSidebar() {
    dispatch('toggleSidebar');
  }
  </script>
  
  <nav class="navbar navbar-expand-lg navbar-light bg-white shadow-sm">
    <div class="container-fluid px-4">
      <!-- Sidebar toggle for mobile -->
      <!-- svelte-ignore a11y_consider_explicit_label -->
      <button 
        class="btn btn-outline-primary me-3 d-md-none" 
        type="button" 
        on:click={toggleSidebar}
      >
        <i class="bi bi-list"></i>
      </button>
  
      <!-- Logo with modern styling -->
      <a class="navbar-brand d-flex align-items-center" href="/">
        <img src="logo blue.png" alt="Logo" class="me-2" style="height: 40px;"> <!-- Adjust height as needed -->
        <span class="fw-bold">Mcdial</span>
      </a>
  
      <!-- Responsive toggle -->
      <!-- svelte-ignore a11y_consider_explicit_label -->
      <button 
        class="navbar-toggler" 
        type="button" 
        on:click={() => isMenuOpen = !isMenuOpen}
        aria-expanded={isMenuOpen}
      >
        <span class="navbar-toggler-icon"></span>
      </button>
    </div>
  </nav>
  
  <style>
    /* Additional styles if necessary */
    .navbar-brand img {
      max-height: 40px; /* Adjust height to fit your design */
    }
  </style>