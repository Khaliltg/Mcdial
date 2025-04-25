<style>
  /* Couleurs principales */
  :root {
    --primary-color: #007bff; /* Bleu Bootstrap */
    --secondary-color: #6c757d; /* Gris Bootstrap */
    --light-gray: #f8f9fa; /* Gris très clair pour l'arrière-plan */
    --dark-gray: #343a40; /* Gris foncé pour le texte important */
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
    .col-md-3 {
      width: 25%; /* Ajuste la largeur des colonnes à 25% sur les écrans moyens et grands */
    }

    .col-md-9 {
      width: 75%; /* Ajuste la largeur des colonnes à 75% sur les écrans moyens et grands */
    }
  }
</style>

<script>
  let startDate = "";
  let endDate = "";
  let dateField = "";
  let headerRow = "";
  let recordingFields = "";
  let perCallNotes = "";
  let useDIDFilter = "";
  let exportFields = "";
  let excludeCallLog = "";
  let searchArchived = "";

  let campaigns = ["B2C", "CANADA1"];
  let inboundGroups = ["AGENTDIRECT", "AGENTDIRECT_CHAT"];
  let lists = ["2025", "10058"];
  let statuses = ["A", "AA", "AB", "ADAIR", "ADC","ADCT","AFAX","AFTHRS","AL","AL","AM","B","CALLBK","CBHOLD","DAIR","DC","DEC","DNCC","DNCL","DROP","ERI","INCALL","IQNANQ","IVRXFR","LRERR","LSMERG","MAXCAL","MLINAT","N","NA","NANQUE","NEW","NI","NP","PDROP","PM","PU","QCFAIL","QUEUE","QVMAIL","RQXFER","SALE","SVYCLM","SVYEXT","SVYHU","SVYREC","SVYVM","TIMEOT","XDROP","XFER","BAR","FM","FN","GNDIS","HC","HORSCI","NRP","OK","PARTIC","PSL","REFARG","REFUS","REP","ScF"];
  let userGroups = ["ADMIN", "seddik", "strategie", "test", "test2", "test3"];
</script>

<div class="container mt-4">
  <h2 class="text-center">Export Leads Report</h2>
  <p class="text-center small text-muted">
    This report pulls lead information for calls dialed in the selected date range. A lead is only exported once no matter how many calls were handled. The current lead status is used.
  </p>

  <form class="row g-3">
    <!-- Date Range -->
    <div class="col-md-6">
      <label class="form-label">From:</label>
      <input type="date" class="form-control" bind:value={startDate} />
    </div>
    <div class="col-md-6">
      <label class="form-label">To:</label>
      <input type="date" class="form-control" bind:value={endDate} />
    </div>

    <!-- Selects à gauche -->
    <div class="col-md-3">
      <label class="form-label">Date Field:</label>
      <select class="form-select" bind:value={dateField}>
        <option>Call date</option>
        <option>entry date</option>
      </select>

      <label class="form-label mt-3">Header Row:</label>
      <select class="form-select" bind:value={headerRow}>
        <option>YES</option>
        <option>NO</option>
      </select>

      <label class="form-label mt-3">Recording Fields:</label>
      <select class="form-select" bind:value={recordingFields}>
        <option>NONE</option>
        <option>ALL</option>
        <option>ID</option>
        <option>LOCATION</option>
        <option>FILENAME</option>
      </select>

      <label class="form-label mt-3">Per Call Notes:</label>
      <select class="form-select" bind:value={perCallNotes}>
        <option>NO</option>
        <option>YES</option>
      </select>

      <label class="form-label mt-3">Use DID filter:</label>
      <select class="form-select" bind:value={useDIDFilter}>
        <option>NO</option>
        <option>YES</option>
      </select>

      <label class="form-label mt-3">Export Fields:</label>
      <select class="form-select" bind:value={exportFields}>
        <option>STANDARD</option>
        <option>EXTENDED</option>
      </select>

      <label class="form-label mt-3">Exclude Call Log Data:</label>
      <select class="form-select" bind:value={excludeCallLog}>
        <option>NO</option>
        <option>YES</option>
      </select>

      <label class="form-label mt-3">Search archived data:</label>
      <select class="form-select" bind:value={searchArchived}>
        <option>NO</option>
        <option>LOGS ONLY</option>
        <option>VICIDIAL_LISTE</option>
        <option>ALL ARCHIVES</option>
      </select>
    </div>

    <!-- Selects à droite -->
    <div class="col-md-9">
      <div class="row">
        <div class="col-md-4">
          <label class="form-label">Campaigns:</label>
          <select class="form-select" multiple>
            <option disabled selected>--ALL--</option>
            {#each campaigns as c}
              <option>{c}</option>
            {/each}
          </select>
        </div>

        <div class="col-md-4">
          <label class="form-label">Inbound Groups:</label>
          <select class="form-select" multiple>
            <option disabled selected>--NONE--</option>
            {#each inboundGroups as g}
              <option>{g}</option>
            {/each}
          </select>
        </div>

        <div class="col-md-4">
          <label class="form-label">Lists:</label>
          <select class="form-select" multiple>
            <option disabled selected>--ALL--</option>
            {#each lists as l}
              <option>{l}</option>
            {/each}
          </select>
        </div>

        <div class="col-md-6">
          <label class="form-label">Statuses:</label>
          <select class="form-select" multiple>
            <option disabled selected>--ALL--</option>
            {#each statuses as s}
              <option>{s}</option>
            {/each}
          </select>
        </div>

        <div class="col-md-6">
          <label class="form-label">User Groups:</label>
          <select class="form-select" multiple>
            <option disabled selected>--ALL--</option>
            {#each userGroups as u}
              <option>{u}</option>
            {/each}
          </select>
        </div>
      </div>
    </div>

    <!-- Submit -->
    <div class="col-12 text-center mt-4">
      <button type="submit" class="btn btn-primary">SUBMIT</button>
    </div>
  </form>
</div>