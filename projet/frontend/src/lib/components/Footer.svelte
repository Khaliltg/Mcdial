<footer class="bg-white border-top py-3 mt-auto">
  <div class="container">
     
    <div class="d-flex justify-content-between align-items-center">
      <div class="d-flex align-items-center">
        <i class="bi bi-graph-up-arrow me-2 text-primary"></i>
        <span class="text-muted">Mc_solutions</span>
      </div>
      <div class="text-muted small">
        &copy; 2025 All Rights Reserved
      </div>
      <div class="d-flex">
        {#each [
          { icon: 'twitter', href: 'https://twitter.com' },
          { icon: 'linkedin', href: 'https://linkedin.com' },
          { icon: 'github', href: 'https://github.com' }
        ] as social}
          <a 
            href={social.href} 
            class="text-muted mx-2"
            target="_blank" 
            rel="noopener noreferrer"
          >
            <i class="bi bi-{social.icon}"></i>
          </a>
        {/each}
      </div>
    </div>
  </div>
</footer>


<style>
  footer {
    position:static;
    bottom: 0;
    left: 0;
    width: 100%;
    background: #333;
    color: white;
    text-align: center;
    padding: 10px;
  }
</style>

