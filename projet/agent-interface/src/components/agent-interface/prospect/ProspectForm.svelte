<script lang="ts">
  import { onMount } from 'svelte';
  import { agentState } from '../../../stores/agent';
  
  // Props
  export let prospectData: any = null;
  export let onSave: (data: any) => void = () => {};
  
  // Local state for form data
  let formData: any = {};
  
  // Initialize form data when prospectData changes
  $: {
    console.log('ProspectForm received prospectData:', prospectData);
    if (prospectData) {
      formData = { ...prospectData };
      console.log('ProspectForm updated formData:', formData);
    } else {
      // Initialize with empty values based on agent state
      formData = {
        lead_id: $agentState.leadId || '',
        phone_number: $agentState.phoneNumber || '',
        first_name: '',
        last_name: '',
        address1: '',
        address2: '',
        city: '',
        state: '',
        postal_code: '',
        email: '',
        comments: ''
      };
      console.log('ProspectForm initialized empty formData:', formData);
    }
  }
  
  function handleSubmit() {
    onSave(formData);
  }
  
  function handleChange(field: string, value: string) {
    formData = {
      ...formData,
      [field]: value
    };
  }
  
  // @ts-ignore
  function handleInputChange(field: string, e) {
    // Seul le champ commentaire est modifiable
    if (field === 'comments') {
      const value = e.target.value;
      handleChange(field, value);
    }
  }
</script>

<div class="card border-0 shadow-sm rounded-3">
  <form on:submit|preventDefault={handleSubmit}>
    <!-- Header with lead ID if available -->
    <div class="card-header bg-primary bg-gradient text-white rounded-top">
      <div class="d-flex justify-content-between align-items-center">
        <h5 class="mb-0 d-flex align-items-center fs-6 fw-semibold">
          <i class="bi bi-person-vcard me-2"></i>
          Fiche Prospect
        </h5>
        {#if formData.lead_id}
          <span class="badge bg-white text-primary rounded-pill shadow-sm">
            <i class="bi bi-hash me-1 small"></i>{formData.lead_id}
          </span>
        {/if}
      </div>
    </div>
    
    <div class="card-body p-3">
      <!-- Main information section -->
      <div class="mb-3 pb-2 border-bottom">
        <h6 class="mb-2 d-flex align-items-center fw-semibold text-secondary">
          <i class="bi bi-person-fill me-2 text-primary"></i>
          Informations principales
        </h6>
        <div class="row g-2 mb-2">
          <div class="col-md-6 mb-2 mb-md-0">
            <label for="first_name" class="form-label small mb-0">Prénom</label>
            <div class="input-group">
              <span class="input-group-text py-0 px-2 bg-light text-secondary border-end-0"><i class="bi bi-person"></i></span>
              <input 
                type="text" 
                id="first_name" 
                class="form-control form-control-sm border-start-0 bg-light"
                value={formData.first_name || ''} 
                readonly
              />
            </div>
          </div>
          <div class="col-md-6">
            <label for="last_name" class="form-label small mb-0">Nom</label>
            <div class="input-group">
              <span class="input-group-text py-0 px-2 bg-light text-secondary border-end-0"><i class="bi bi-person"></i></span>
              <input 
                type="text" 
                id="last_name" 
                class="form-control form-control-sm border-start-0 bg-light"
                value={formData.last_name || ''} 
                readonly
              />
            </div>
          </div>
        </div>
        
        <div class="row g-2 mb-2">
          <div class="col-md-6 mb-2 mb-md-0">
            <label for="email" class="form-label small mb-0">Email</label>
            <div class="input-group">
              <span class="input-group-text py-0 px-2 bg-light text-secondary border-end-0"><i class="bi bi-envelope"></i></span>
              <input 
                type="email" 
                id="email" 
                class="form-control form-control-sm border-start-0 bg-light"
                value={formData.email || ''} 
                readonly
              />
            </div>
          </div>
          <div class="col-md-6">
            <label for="phone_number" class="form-label small mb-0">Téléphone</label>
            <div class="input-group">
              <span class="input-group-text py-0 px-2 bg-light text-secondary border-end-0"><i class="bi bi-telephone"></i></span>
              <input 
                type="tel" 
                id="phone_number" 
                class="form-control form-control-sm border-start-0 bg-light"
                value={formData.phone_number || ''} 
                readonly
              />
            </div>
          </div>
        </div>
      </div>
    
      <!-- Address section with Bootstrap styling -->  
      <div class="mb-3 pb-2 border-bottom">
        <h6 class="mb-2 d-flex align-items-center fw-semibold text-secondary">
          <i class="bi bi-geo-alt me-2 text-primary"></i>
          Adresse
        </h6>
        
        <div class="mb-3">
          <label for="address1" class="form-label small mb-0">Adresse</label>
          <input 
            type="text" 
            id="address1" 
            class="form-control form-control-sm border-start-0 bg-light"
            value={formData.address1 || ''} 
            readonly
          />
        </div>
        
        <div class="row g-2 mb-2">
          <div class="col-md-6 mb-2 mb-md-0">
            <label for="city" class="form-label small mb-0">Ville</label>
            <div class="input-group">
              <span class="input-group-text py-0 px-2 bg-light text-secondary border-end-0"><i class="bi bi-building"></i></span>
              <input 
                type="text" 
                id="city" 
                class="form-control form-control-sm border-start-0 bg-light"
                value={formData.city || ''} 
                readonly
              />
            </div>
          </div>
          <div class="col-md-6">
            <label for="state" class="form-label small mb-0">Région</label>
            <div class="input-group">
              <span class="input-group-text py-0 px-2 bg-light text-secondary border-end-0"><i class="bi bi-map"></i></span>
              <input 
                type="text" 
                id="state" 
                class="form-control form-control-sm border-start-0 bg-light"
                value={formData.state || ''} 
                readonly
              />
            </div>
          </div>
        </div>
        
        <div class="row g-2">
          <div class="col-md-6 mb-2 mb-md-0">
            <label for="postal_code" class="form-label small mb-0">Code postal</label>
            <div class="input-group">
              <span class="input-group-text py-0 px-2 bg-light text-secondary border-end-0"><i class="bi bi-mailbox"></i></span>
              <input 
                type="text" 
                id="postal_code" 
                class="form-control form-control-sm border-start-0 bg-light"
                value={formData.postal_code || ''} 
                readonly
              />
            </div>
          </div>
          <div class="col-md-6">
            <label for="country_code" class="form-label small mb-0">Pays</label>
            <div class="input-group">
              <span class="input-group-text py-0 px-2 bg-light text-secondary border-end-0"><i class="bi bi-globe"></i></span>
              <input 
                type="text" 
                id="country_code" 
                class="form-control form-control-sm border-start-0 bg-light"
                value={formData.country_code || ''} 
                readonly
              />
            </div>
          </div>
        </div>
      </div>
      
      <!-- Additional information section with Bootstrap styling -->
      <div class="mb-3">
        <h6 class="mb-2 d-flex align-items-center fw-semibold text-secondary">
          <i class="bi bi-info-circle me-2 text-primary"></i>
          Informations complémentaires
        </h6>
        
        <div class="mb-3">
          <label for="comments" class="form-label small mb-0">Commentaires</label>
          <textarea 
            id="comments" 
            rows="2" 
            class="form-control form-control-sm border-start-0"
            value={formData.comments || ''} 
            on:input={e => handleInputChange('comments', e)}
          ></textarea>
        </div>
        
        <div class="row g-2">
          <div class="col-md-6 mb-2 mb-md-0">
            <label for="vendor_lead_code" class="form-label small mb-0">Code vendeur</label>
            <div class="input-group">
              <span class="input-group-text py-0 px-2 bg-light text-secondary border-end-0"><i class="bi bi-tag"></i></span>
              <input 
                type="text" 
                id="vendor_lead_code" 
                class="form-control form-control-sm border-start-0 bg-light"
                value={formData.vendor_lead_code || ''} 
                readonly
              />
            </div>
          </div>
          <div class="col-md-6">
            <label for="source_id" class="form-label small mb-0">Source</label>
            <div class="input-group">
              <span class="input-group-text py-0 px-2 bg-light text-secondary border-end-0"><i class="bi bi-funnel"></i></span>
              <input 
                type="text" 
                id="source_id" 
                class="form-control form-control-sm border-start-0 bg-light"
                value={formData.source_id || ''} 
                readonly
              />
            </div>
          </div>
        </div>
      </div>
      
      <!-- Form actions with Bootstrap styling -->
      <div class="d-flex justify-content-end">
        <button type="submit" class="btn btn-sm btn-primary rounded-pill px-3">
          <i class="bi bi-save me-1"></i>
          Enregistrer
        </button>
      </div>
    </div>
  </form>
</div>

<style>
  /* All styling is handled by Bootstrap */
</style>
