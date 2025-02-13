<script>
  import Navbar from "./components/Navbar.svelte";
  import Sidebar from "./components/Sidebar.svelte";
  import Footer from "./components/Footer.svelte";

  let isOpen = false;

  function toggleSidebar() {
    isOpen = !isOpen;
  }
</script>

<style>
  :global(:root) {
    --primary-color: #007bff;
    --secondary-color: #343a40;
    --sidebar-bg-color: #495057;
    --background-color: #f8f9fa;
    --text-color: #212529;
    --white: #ffffff;
    --border-radius: 8px;
  }

  body {
    margin: 0;
    font-family: 'Inter', system-ui, Avenir, Helvetica, Arial, sans-serif;
    color: var(--text-color);
    background-color: var(--background-color);
    display: flex;
  }

  .container {
    display: flex;
    width: 100%;
    min-height: 100vh;
  }

  .main-content {
    flex: 1;
    margin-left: 250px;
    padding: 70px 20px 60px; /* Pour éviter l'overlap avec la navbar et le footer */
    display: flex;
    flex-direction: column;
  }

  .content {
    flex: 1;
  }
</style>

<div class="container">
  <Sidebar  />
  <div class="main-content">
    <Navbar  />
    <div class="content">
      <h2>Welcome to the App!</h2>
      <p>This is the main content area. You can add your features here.</p>
    </div>
    <Footer />
  </div>
</div>
