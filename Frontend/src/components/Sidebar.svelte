<style>
    .sidebar {
      width: 250px;
      height: 100vh;
      background-color: var(--sidebar-bg-color);
      color: var(--white);
      padding: 2em;
      position: fixed;
      left: 0;
      top: 0;
      bottom: 0;
      z-index: 1000; /* Assure que la sidebar est au-dessus des autres éléments */
      box-sizing: border-box;
    }
  
    ul {
      list-style: none;
      padding: 0;
    }
  
    li {
      margin: 1.5em 0;
    }
  
    a {
      color: var(--white);
      text-decoration: none;
      display: block;
      padding: 0.5em;
      border-radius: var(--border-radius);
    }
  
    a:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }
  </style>
  
  <div class="sidebar">
    <h2>Menu</h2>
    <ul>
      <li><a href="#">test</a></li>
      <li><a href="#">test</a></li>
      <li><a href="#">test</a></li>
      <li><a href="#">Logout</a></li>
    </ul>
  </div>
  