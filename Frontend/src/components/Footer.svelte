<style>
    footer {
      position: fixed;
      bottom: 0;
      left: 250px; /* Aligne avec la sidebar */
      width: calc(100% - 250px); /* Ajuste pour éviter le chevauchement */
      height: 60px;
      background: linear-gradient(135deg, var(--secondary-color), #1d1f23); /* Dégradé moderne */
      color: var(--white);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 2rem;
      font-size: 0.9rem;
      box-shadow: 0 -2px 5px rgba(0, 0, 0, 0.2);
      z-index: 900;
      box-sizing: border-box;
    }
  
    .footer-left {
      font-weight: 500;
    }
  
    .footer-right {
      display: flex;
      gap: 15px;
    }
  
    .footer-right a {
      color: var(--white);
      text-decoration: none;
      font-weight: 500;
      transition: color 0.3s ease-in-out;
    }
  
    .footer-right a:hover {
      color: var(--primary-color);
    }
  </style>
  
  <footer>
    <div class="footer-left">
      &copy; 2025 Your Company - All rights reserved
    </div>
    <div class="footer-right">
      <a href="#">Privacy Policy</a>
      <a href="#">Terms of Service</a>
      <a href="#">Contact</a>
    </div>
  </footer>
  