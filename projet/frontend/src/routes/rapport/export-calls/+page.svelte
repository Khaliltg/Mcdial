<style>
  /* Couleurs principales */
  :root {
    --primary-color: #007bff; /* Bleu Bootstrap */
    --secondary-color: #6c757d; /* Gris Bootstrap */
    --light-gray: #f8f9fa; /* Gris très clair pour l'arrière-plan */
    --dark-gray: #343a40; /* Gris foncé pour le texte important */
    --accent-color: #28a745; /* Vert Bootstrap pour l'accentuation */
  }

  body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background-color: var(--light-gray);
    color: var(--dark-gray);
  }

  .container {
    background-color: #fff;
    padding: 2rem;
    border-radius: 0.5rem;
    box-shadow: 0 0.25rem 0.5rem rgba(0, 0, 0, 0.05);
  }

  h2 {
    color: var(--primary-color);
    margin-bottom: 1.5rem;
  }

  .form-label {
    font-weight: 500;
    color: var(--dark-gray);
  }

  .form-control,
  .form-select {
    border-radius: 0.25rem;
    border: 1px solid #ced4da;
  }

  .form-control:focus,
  .form-select:focus {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
  }

  .btn-primary {
    background-color: var(--primary-color);
    border-color: var(--primary-color);
    transition: background-color 0.2s ease-in-out, border-color 0.2s ease-in-out;
  }

  .btn-primary:hover {
    background-color: #0069d9;
    border-color: #0062cc;
  }

  /* Style pour les select multiple */
  .form-select[multiple] {
    height: auto; /* Ajuste automatiquement la hauteur */
  }

  /* Espacement amélioré */
  .mt-3 {
    margin-top: 1.5rem !important;
  }

  /* Alignement du texte pour le bouton */
  .text-center {
    text-align: center !important;
  }

  /* Style pour le texte muted */
  .text-muted {
    color: #6c757d !important;
  }

  /* Responsive design pour les colonnes */
  @media (min-width: 768px) {
    .col-md-4 {
      width: 33.33%;
    }

    .col-md-6 {
      width: 50%;
    }
  }

  /* Style pour les radio buttons */
  .form-check-input:checked {
    background-color: var(--accent-color);
    border-color: var(--accent-color);
  }

  .form-check-input:focus {
    box-shadow: 0 0 0 0.2rem rgba(40, 167, 69, 0.25);
  }

  /* Ajout d'une bordure légère pour améliorer la séparation visuelle */
  .col-md-4,
  .col-md-6,
  .col-12 {
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    padding-bottom: 1rem;
    margin-bottom: 1rem;
  }

  /* Suppression de la bordure sur le dernier élément pour une apparence propre */
  .col-12:last-child {
    border-bottom: none;
    margin-bottom: 0;
    padding-bottom: 0;
  }
</style>

<script>
  let startDate = "";
  let startTime = "";
  let endDate = "";
  let endTime = "";
  let user = "";
  let dateField = " ";
  let sortOrder = "";
  let headerRow = "";
  let recFields = "";
  let customFields = "";
  let perCallNotes = "";
  let exportType = "";
  let searchArchived = "";

  // Listes simulées (à remplacer par des données dynamiques si besoin)
  let campaigns = ["b2b", "B2C", "BIIM_COM","BiimCom","BTOC2", "Citroen","CITROENB", "EDENRED","EDENRED1","LEAD_B2B" ,"LeadMc","Qualif24"];
  let inboundGroups = ["AGENTDIRECT", "AGENTDIRECT_CHAT","--NONE--"];
  let lists = ["2025","10058"];
  let statuses = ["A", "AA", "AB", "ADAIR", "ADC","ADCT","AFAX","AFTHRS","AL","AL","AM","B","CALLBK","CBHOLD","DAIR","DC","DEC","DNCC","DNCL","DROP","ERI","INCALL","IQNANQ","IVRXFR","LRERR","LSMERG","MAXCAL","MLINAT","N","NA","NANQUE","NEW","NI","NP","PDROP","PM","PU","QCFAIL","QUEUE","QVMAIL","RQXFER","SALE","SVYCLM","SVYEXT","SVYHU","SVYREC","SVYVM","TIMEOT","XDROP","XFER","BAR","FM","FN","GNDIS","HC","HORSCI","NRP","OK","PARTIC","PSL","REFARG","REFUS","REP","ScF"];
  let userGroups = ["Admin", "seddik", "strategie","test","test2","test3"];
</script>

<div class="container mt-4">
  <h2 class="text-center">Export Calls Report</h2>
  
  <form class="row g-3">
    <!-- Date Range -->
    <div class="col-md-6">
      <label class="form-label">From:</label>
      <div class="input-group">
        <input type="date" bind:value={startDate} class="form-control" />
        
      </div>
    </div>
    <div class="col-md-6">
      <label class="form-label">To:</label>
      <div class="input-group">
        <input type="date" bind:value={endDate} class="form-control" />
        
      </div>
    </div>

    <!-- User -->
    <div class="col-12">
      <label class="form-label">User:</label>
      <input type="text" bind:value={user} class="form-control" />
    </div>

    <!-- Selects -->
    <div class="col-md-4">
      <label class="form-label">Campaigns:</label>
      <select class="form-select" multiple>
        <option disabled selected>--ALL--</option>
        {#each campaigns as campaign}
          <option>{campaign}</option>
        {/each}
      </select>
    </div>

    <div class="col-md-4">
      <label class="form-label">Inbound Groups:</label>
      <select class="form-select" multiple>
        <option disabled selected>--ALL--</option>
        {#each inboundGroups as group}
          <option>{group}</option>
        {/each}
      </select>
    </div>

    <div class="col-md-4">
      <label class="form-label">Lists:</label>
      <select class="form-select" multiple>
        <option disabled selected>--ALL--</option>
        {#each lists as list}
          <option>{list}</option>
        {/each}
      </select>
    </div>

    <!-- Statuses + User Groups -->
    <div class="col-md-6">
      <label class="form-label">Statuses:</label>
      <select class="form-select" multiple>
        <option disabled selected>--ALL--</option>
        {#each statuses as status}
          <option>{status}</option>
        {/each}
      </select>
    </div>

    <div class="col-md-6">
      <label class="form-label">User Groups:</label>
      <select class="form-select" multiple>
        <option disabled selected>--ALL--</option>
        {#each userGroups as group}
          <option>{group}</option>
        {/each}
      </select>
    </div>

    <!-- Other fields -->
    <div class="col-md-4">
      <label class="form-label">Date Field:</label>
      <select class="form-select" bind:value={dateField}>
        <option>Call date</option>
        <option>entry date</option>
      </select>
    </div>

    <div class="col-md-4">
      <label class="form-label">Sort order:</label>
      <div class="form-check">
        <input class="form-check-input" type="radio" bind:group={sortOrder} value="Ascending" />
        <label class="form-check-label">Ascending</label>
      </div>
      <div class="form-check">
        <input class="form-check-input" type="radio" bind:group={sortOrder} value="Descending" />
        <label class="form-check-label">Descending</label>
      </div>
    </div>

    <div class="col-md-4">
      <label class="form-label">Header Row:</label>
      <select class="form-select" bind:value={headerRow}>
        <option>YES</option>
        <option>NO</option>
      </select>
    </div>

    <div class="col-md-4">
      <label class="form-label">Rec Fields:</label>
      <select class="form-select" bind:value={recFields}>
        <option>NONE</option>
        <option> ID</option>
        <option>FILENAME</option>
        <option>LOCATION</option>
        <option>ALL</option>
      </select>
    </div>

    <div class="col-md-4">
      <label class="form-label">Custom Fields:</label>
      <select class="form-select" bind:value={customFields}>
        <option>NO</option>
        <option>YES</option>
      </select>
    </div>

    <div class="col-md-4">
      <label class="form-label">Per Call Notes:</label>
      <select class="form-select" bind:value={perCallNotes}>
        <option>NO</option>
        <option>YES</option>
      </select>
    </div>

    <div class="col-md-6">
      <label class="form-label">Export Type:</label>
      <select class="form-select" bind:value={exportType}>
        <option>STANDARD</option>
        <option>EXTENDED</option>
        <option>EXTENDED_2</option>
        <option>EXTENDED_3</option>
        <option>EXTENDED_4</option>
        <option>ALTERNATE_1</option>
        <option>ALTERNATE_2</option>

      </select>
    </div>

  

    <div class="col-12 text-center">
      <button type="submit" class="btn btn-primary mt-3">SUBMIT</button>
    </div>
  </form>
</div>