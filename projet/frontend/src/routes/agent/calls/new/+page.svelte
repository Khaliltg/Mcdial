<script lang="ts">
  import { onMount } from 'svelte';
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth.js';

  // Types pour les données
  interface Campaign {
    id: number;
    name: string;
    active: boolean;
  }

  interface Contact {
    id: number;
    name: string;
    phone: string;
    email: string;
    lastContact?: string;
    status: string;
    campaign: number;
  }

  interface Script {
    id: number;
    title: string;
    campaign: number;
    content: string;
  }

  // Données pour la page
  let campaigns: Campaign[] = [];
  let isLoading = true;
  let contacts: Contact[] = [];
  let filteredContacts: Contact[] = [];
  let searchQuery = '';
  let selectedContact: Contact | null = null;
  let selectedCampaign: string = 'all';
  let callStatus = 'idle'; // idle, connecting, active, ended
  let callDuration = 0;
  let timerInterval: number | null = null;
  let callNotes = '';
  let showScriptPanel = false;
  let currentScript: Script | null = null;
  let scripts: Script[] = [];

  // Chargement initial des données initiales
  onMount(async () => {
    try {
      // Simuler un délai de chargement
      await new Promise(resolve => setTimeout(resolve, 800));

      // Dans une vraie application, ces données viendraient d'une API
      campaigns = [
        { id: 1, name: 'Campagne Printemps 2025', active: true },
        { id: 2, name: 'Nouveaux clients potentiels', active: true },
        { id: 3, name: 'Relance clients inactifs', active: true },
        { id: 4, name: 'Offre spéciale été', active: false }
      ];

      contacts = [
        { id: 1, name: 'Jean Dupont', phone: '06 12 34 56 78', email: 'jean.dupont@example.com', lastContact: '2025-04-10', status: 'Intéressé', campaign: 1 },
        { id: 2, name: 'Marie Martin', phone: '06 23 45 67 89', email: 'marie.martin@example.com', lastContact: '2025-04-12', status: 'À rappeler', campaign: 1 },
        { id: 3, name: 'Pierre Durand', phone: '06 34 56 78 90', email: 'pierre.durand@example.com', lastContact: '2025-04-15', status: 'Converti', campaign: 2 },
        { id: 4, name: 'Sophie Petit', phone: '06 45 67 89 01', email: 'sophie.petit@example.com', lastContact: '2025-04-08', status: 'Non intéressé', campaign: 3 },
        { id: 5, name: 'Thomas Bernard', phone: '06 56 78 90 12', email: 'thomas.bernard@example.com', lastContact: '2025-04-14', status: 'En attente', campaign: 2 },
        { id: 6, name: 'Julie Leroy', phone: '06 67 89 01 23', email: 'julie.leroy@example.com', lastContact: '2025-04-05', status: 'Intéressé', campaign: 3 },
        { id: 7, name: 'Nicolas Moreau', phone: '06 78 90 12 34', email: 'nicolas.moreau@example.com', lastContact: '2025-04-11', status: 'À rappeler', campaign: 1 }
      ];

      scripts = [
        { 
          id: 1, 
          title: 'Script d\'introduction', 
          campaign: 1,
          content: `
            <h3>Introduction</h3>
            <p>Bonjour, je m'appelle [Votre nom] de McDial. Puis-je parler à [Nom du contact] ?</p>
            
            <h3>Présentation</h3>
            <p>Je vous appelle aujourd'hui concernant notre nouvelle offre de printemps qui pourrait vous intéresser.</p>
            
            <h3>Questions clés</h3>
            <ul>
              <li>Êtes-vous satisfait de votre fournisseur actuel ?</li>
              <li>Quels sont vos besoins principaux en ce moment ?</li>
              <li>Seriez-vous intéressé par une démonstration de notre service ?</li>
            </ul>
            
            <h3>Objections courantes</h3>
            <p><strong>Je n'ai pas le temps :</strong> Je comprends. Quand serait-il plus convenable de vous rappeler ?</p>
            <p><strong>Je ne suis pas intéressé :</strong> Puis-je vous demander pourquoi notre offre ne vous intéresse pas ?</p>
            <p><strong>C'est trop cher :</strong> Nous avons différentes options tarifaires adaptées à tous les budgets.</p>
            
            <h3>Conclusion</h3>
            <p>Merci pour votre temps. Je vais vous envoyer plus d'informations par email et je vous recontacterai [date].</p>
          `
        },
        { 
          id: 2, 
          title: 'Script de relance', 
          campaign: 3,
          content: `
            <h3>Introduction</h3>
            <p>Bonjour [Nom du contact], c'est [Votre nom] de McDial. Nous nous sommes parlé il y a quelque temps.</p>
            
            <h3>Rappel</h3>
            <p>Lors de notre dernière conversation, vous aviez exprimé un intérêt pour [produit/service]. Je vous appelle pour voir si vous avez eu le temps d'y réfléchir.</p>
            
            <h3>Nouvelle proposition</h3>
            <p>Depuis notre dernier échange, nous avons amélioré notre offre avec [nouvelles fonctionnalités/avantages].</p>
            
            <h3>Objections courantes</h3>
            <p><strong>J'ai oublié de quoi il s'agissait :</strong> Pas de problème, je peux vous rafraîchir la mémoire...</p>
            <p><strong>J'ai choisi un autre fournisseur :</strong> Puis-je vous demander ce qui a motivé votre choix ?</p>
            
            <h3>Conclusion</h3>
            <p>Merci pour votre temps. Souhaitez-vous que je vous envoie notre nouvelle documentation ?</p>
          `
        }
      ];

      isLoading = false;
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      isLoading = false;
    }
  });

  // Filtrer les contacts en fonction de la campagne sélectionnée et de la recherche
  function filterContacts(): void {
    if (!contacts || !contacts.length) return;
    
    if (selectedCampaign) {
      const campaignId = parseInt(selectedCampaign);
      filteredContacts = contacts.filter(contact => contact.campaign === campaignId);
    } else {
      filteredContacts = [...contacts];
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredContacts = filteredContacts.filter(contact => 
        contact.name.toLowerCase().includes(query) || 
        contact.phone.toLowerCase().includes(query) || 
        contact.email && contact.email.toLowerCase().includes(query)
      );
    }
  }

  // Sélectionner un contact
  function selectContact(contact: Contact): void {
    selectedContact = contact;
    
    // Trouver un script correspondant à la campagne du contact
    if (contact && contact.campaign) {
      const matchingScript = scripts.find(s => s.campaign === contact.campaign);
      if (matchingScript) {
        currentScript = matchingScript;
      }
    }
    
    // Réinitialiser l'état de l'appel
    callStatus = 'idle';
    callDuration = 0;
    callNotes = '';
    clearInterval(timerInterval);
  }

  // Démarrer un appel
  function startCall(): void {
    callStatus = 'connecting';
    
    // Simuler la connexion
    setTimeout(() => {
      callStatus = 'active';
      startTimer();
    }, 2000);
  }

  // Terminer un appel
  function endCall(): void {
    callStatus = 'ended';
    if (timerInterval !== null) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  }

  // Démarrer le chronomètre
  function startTimer(): void {
    timerInterval = window.setInterval(() => {
      callDuration += 1;
    }, 1000);
  }

  // Formater la durée de l'appel
  function formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  }

  // Basculer l'affichage du panneau de script
  function toggleScriptPanel(): void {
    showScriptPanel = !showScriptPanel;
  }

  // Sauvegarder l'appel
  function saveCall(): void {
    // Dans une vraie application, on enverrait ces données à l'API
    alert('Appel sauvegardé avec succès !');
    
    // Réinitialiser
    selectedContact = null;
    callStatus = 'idle';
    callDuration = 0;
    callNotes = '';
    showScriptPanel = false;
  }
</script>

<div class="new-call-container">
  <div class="page-header">
    <h1>Nouvel appel</h1>
    <p class="subtitle">Contactez un prospect ou un client</p>
  </div>

  {#if isLoading}
    <div class="loading-container">
      <div class="spinner"></div>
      <p>Chargement des données...</p>
    </div>
  {:else}
    <div class="row">
      <!-- Liste des contacts -->
      <div class="col-lg-5 mb-4">
        <div class="card h-100">
          <div class="card-header">
            <h2>Sélectionner un contact</h2>
          </div>
          <div class="card-body">
            <div class="mb-3">
              <label for="campaignSelect" class="form-label">Campagne</label>
              <select id="campaignSelect" class="form-select" bind:value={selectedCampaign} on:change={filterContacts}>
                <option value="">Sélectionner une campagne</option>
                {#each campaigns as campaign}
                  <option value={campaign.id} selected={selectedCampaign === campaign.id.toString()}>{campaign.name}</option>
                {/each}
              </select>
            </div>
            
            <div class="mb-3">
              <label for="searchInput" class="form-label">Rechercher</label>
              <input 
                type="text" 
                id="searchInput" 
                class="form-control" 
                placeholder="Nom, téléphone ou email..." 
                bind:value={searchQuery}
                on:input={filterContacts}
              >
            </div>
            
            <div class="contacts-list">
              {#if filteredContacts.length === 0}
                <div class="text-center py-4">
                  <p class="text-muted">Aucun contact trouvé</p>
                </div>
              {:else}
                {#each filteredContacts as contact}
                  <div 
                    class="contact-item {selectedContact && selectedContact.id === contact.id ? 'selected' : ''}"
                    on:click={() => selectContact(contact)}
                    on:keydown={(e) => e.key === 'Enter' && selectContact(contact)}
                    tabindex="0"
                    role="button"
                  >
                    <div class="contact-avatar">
                      {contact.name.charAt(0).toUpperCase()}
                    </div>
                    <div class="contact-info">
                      <h3>{contact.name}</h3>
                      <p class="phone">{contact.phone}</p>
                      <p class="status">
                        <span class="badge bg-{
                          contact.status === 'Intéressé' ? 'success' : 
                          contact.status === 'À rappeler' ? 'warning' : 
                          contact.status === 'Converti' ? 'primary' : 
                          contact.status === 'Non intéressé' ? 'danger' : 'secondary'
                        }">
                          {contact.status}
                        </span>
                      </p>
                    </div>
                  </div>
                {/each}
              {/if}
            </div>
          </div>
        </div>
      </div>
      
      <!-- Détails de l'appel -->
      <div class="col-lg-7 mb-4">
        {#if selectedContact}
          <div class="card h-100">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h2>Appel en cours</h2>
              {#if currentScript}
                <button class="btn btn-outline-primary btn-sm" on:click={toggleScriptPanel}>
                  {showScriptPanel ? 'Masquer le script' : 'Afficher le script'}
                </button>
              {/if}
            </div>
            <div class="card-body">
              <div class="contact-details-header">
                <h3>{selectedContact ? selectedContact.name : 'Contact'}</h3>
                <div class="contact-status">
                  <span class="badge bg-{
                    selectedContact.status === 'Intéressé' ? 'success' : 
                    selectedContact.status === 'À rappeler' ? 'warning' : 
                    selectedContact.status === 'Converti' ? 'primary' : 
                    selectedContact.status === 'Non intéressé' ? 'danger' : 'secondary'
                  }">
                    {selectedContact.status}
                  </span>
                </div>
              </div>
              <div class="contact-details">
                <div class="d-flex align-items-center mb-3">
                  <div class="contact-avatar-lg me-3">
                    {selectedContact.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 class="mb-1">{selectedContact.name}</h3>
                    <p class="mb-0 text-muted">Dernier contact: {selectedContact.lastContact}</p>
                  </div>
                </div>
                
                <div class="row">
                  <div class="col-md-6 mb-3">
                    <div class="contact-field">
                      <span class="field-label">Téléphone</span>
                      <span class="field-value">{selectedContact.phone}</span>
                    </div>
                  </div>
                  <div class="col-md-6 mb-3">
                    <div class="contact-field">
                      <span class="field-label">Email</span>
                      <span class="field-value">{selectedContact.email}</span>
                    </div>
                  </div>
                  <div class="col-md-6 mb-3">
                    <div class="contact-field">
                      <span class="field-label">Statut</span>
                      <span class="field-value">
                        <span class="badge bg-{
                          selectedContact.status === 'Intéressé' ? 'success' : 
                          selectedContact.status === 'À rappeler' ? 'warning' : 
                          selectedContact.status === 'Converti' ? 'primary' : 
                          selectedContact.status === 'Non intéressé' ? 'danger' : 'secondary'
                        }">
                          {selectedContact.status}
                        </span>
                      </span>
                    </div>
                  </div>
                  <div class="col-md-6 mb-3">
                    <div class="contact-field">
                      <span class="field-label">Campagne</span>
                      <span class="field-value">
                        {campaigns.find(c => c.id === selectedContact.campaign)?.name || 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {#if showScriptPanel && currentScript}
                <div class="script-panel mb-4">
                  <h3 class="script-title">{currentScript.title}</h3>
                  <div class="script-content">
                    {@html currentScript.content}
                  </div>
                </div>
              {/if}
              
              <div class="call-controls mb-4">
                <div class="call-status">
                  {#if callStatus === 'idle'}
                    <span class="status-text">Prêt à appeler</span>
                  {:else if callStatus === 'connecting'}
                    <span class="status-text connecting">Connexion en cours...</span>
                  {:else if callStatus === 'active'}
                    <span class="status-text active">Appel en cours - {formatDuration(callDuration)}</span>
                  {:else if callStatus === 'ended'}
                    <span class="status-text ended">Appel terminé - {formatDuration(callDuration)}</span>
                  {/if}
                </div>
                
                <div class="call-buttons">
                  {#if callStatus === 'idle'}
                    <button class="btn btn-success btn-lg" on:click={startCall}>
                      <i class="bi bi-telephone-outbound me-2"></i> Appeler
                    </button>
                  {:else if callStatus === 'connecting' || callStatus === 'active'}
                    <button class="btn btn-danger btn-lg" on:click={endCall}>
                      <i class="bi bi-telephone-x me-2"></i> Terminer
                    </button>
                  {:else if callStatus === 'ended'}
                    <button class="btn btn-primary btn-lg" on:click={saveCall}>
                      <i class="bi bi-save me-2"></i> Sauvegarder
                    </button>
                    <button class="btn btn-outline-secondary btn-lg ms-2" on:click={() => callStatus = 'idle'}>
                      <i class="bi bi-arrow-repeat me-2"></i> Nouvel appel
                    </button>
                  {/if}
                </div>
              </div>
              
              {#if callStatus === 'active' || callStatus === 'ended'}
                <div class="notes-section">
                  <label for="callNotes" class="form-label">Notes d'appel</label>
                  <textarea 
                    id="callNotes" 
                    class="form-control" 
                    rows="4" 
                    placeholder="Saisissez vos notes ici..."
                    bind:value={callNotes}
                  ></textarea>
                </div>
              {/if}
            </div>
          </div>
        {:else}
          <div class="card h-100">
            <div class="card-body d-flex flex-column align-items-center justify-content-center text-center p-5">
              <i class="bi bi-telephone-plus display-1 text-muted mb-3"></i>
              <h3>Aucun contact sélectionné</h3>
              <p class="text-muted">Veuillez sélectionner un contact dans la liste pour démarrer un appel.</p>
            </div>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .new-call-container {
    padding: 1.5rem;
  }

  .page-header {
    margin-bottom: 2rem;
  }

  .page-header h1 {
    font-size: 1.75rem;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 0.5rem;
  }

  .subtitle {
    color: #6b7280;
    font-size: 1rem;
    margin-bottom: 0;
  }

  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 400px;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  /* Cartes */
  .card {
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    border: none;
  }

  .card-header {
    background-color: white;
    border-bottom: 1px solid #e5e7eb;
    padding: 1rem 1.25rem;
  }

  .card-header h2 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 0;
  }

  /* Liste des contacts */
  .contacts-list {
    max-height: 400px;
    overflow-y: auto;
  }

  .contact-item {
    display: flex;
    align-items: center;
    padding: 0.75rem;
    border-radius: 8px;
    margin-bottom: 0.5rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .contact-item:hover {
    background-color: #f9fafb;
  }

  .contact-item.selected {
    background-color: #ebf5ff;
    border-left: 3px solid #3b82f6;
  }

  .contact-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background-color: #e5e7eb;
    color: #4b5563;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    margin-right: 0.75rem;
    flex-shrink: 0;
  }

  .contact-avatar-lg {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background-color: #e5e7eb;
    color: #4b5563;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 1.5rem;
  }

  .contact-info h3 {
    font-size: 0.875rem;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 0.25rem;
  }

  .contact-info p {
    margin-bottom: 0.25rem;
    font-size: 0.75rem;
    color: #6b7280;
  }

  /* Détails du contact */
  .contact-details {
    border-bottom: 1px solid #e5e7eb;
    padding-bottom: 1rem;
  }

  .contact-field {
    display: flex;
    flex-direction: column;
  }

  .field-label {
    font-size: 0.75rem;
    color: #6b7280;
    margin-bottom: 0.25rem;
  }

  .field-value {
    font-size: 0.875rem;
    color: #1f2937;
    font-weight: 500;
  }

  /* Contrôles d'appel */
  .call-controls {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 1.5rem;
    background-color: #f9fafb;
    border-radius: 8px;
  }

  .call-status {
    margin-bottom: 1.5rem;
    text-align: center;
  }

  .status-text {
    font-size: 1.25rem;
    font-weight: 600;
    color: #6b7280;
  }

  .status-text.connecting {
    color: #f59e0b;
  }

  .status-text.active {
    color: #10b981;
  }

  .status-text.ended {
    color: #ef4444;
  }

  /* Script panel */
  .script-panel {
    background-color: #f9fafb;
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1.5rem;
  }

  .script-title {
    font-size: 1rem;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 0.75rem;
  }

  .script-content {
    max-height: 300px;
    overflow-y: auto;
    font-size: 0.875rem;
  }

  :global(.script-content h3) {
    font-size: 1.2rem;
    font-weight: 600;
    margin-bottom: 1rem;
    color: #2563eb;
  }
  
  :global(.script-content p) {
    margin-bottom: 1rem;
  }
  
  :global(.script-content ul) {
    list-style-type: disc;
    margin-left: 1.5rem;
    margin-bottom: 1rem;
  }

  /* Badges */
  .badge {
    font-weight: 500;
    padding: 0.35em 0.65em;
    font-size: 0.75em;
  }

  /* Responsive */
  @media (max-width: 767.98px) {
    .new-call-container {
      padding: 1rem;
    }
  }
</style>
