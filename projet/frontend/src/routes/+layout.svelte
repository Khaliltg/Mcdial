<script>
// @ts-nocheck
import '../app.css';
import Navbar from '$lib/components/Navbar.svelte';
import Sidebar from '$lib/components/Sidebar.svelte';
import Footer from '$lib/components/Footer.svelte';
import '../app.css';
let isSidebarOpen = false;

function toggleSidebar() {
  isSidebarOpen = !isSidebarOpen;
}
</script>

<div class="d-flex flex-column min-vh-100">
  <Navbar on:toggleSidebar={toggleSidebar} />

  <div class="container-fluid flex-grow-1 mt-5">
    <div class="row">
      <div class="col-md-3 col-lg-2 d-md-block bg-light sidebar p-0">
        <Sidebar isOpen={isSidebarOpen} />
      </div>
      
      <main class="col-md-9 ms-sm-auto col-lg-10 px-md-4 pt-3">
        <slot />
      </main>
    </div>
  </div>

  <Footer />
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