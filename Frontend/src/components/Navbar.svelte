<script>
    import img from "../../public/WhatsApp Image 2025-02-13 at 16.14.36.jpeg"
</script>
<style>
    .navbar {
      background-color: var(--secondary-color);
      color: var(--white);
      padding: 1em 2em;
      display: flex;
      justify-content: space-between;
      align-items: center;
      position: fixed;
      top: 0;
      left: 250px; /* Début après la sidebar */
      width: calc(100% - 250px);
      height: 60px;
      z-index: 900; /* Moins que la sidebar pour éviter le chevauchement */
      box-sizing: border-box;
    }
  </style>
  
  <div class="navbar">
    <h1><img src={img} alt="" width="100" height="68"></h1>
  </div>
  