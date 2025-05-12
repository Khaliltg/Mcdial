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
    // Access the value from the input element
    const value = e.target.value;
    handleChange(field, value);
  }
</script>

<div class="card">
  {#if !$agentState.callActive && !prospectData}
    <div class="card-body text-center py-5">
      <div class="d-flex justify-content-center mb-3">
        <div class="bg-light p-3 rounded-circle">
          <i class="bi bi-person-circle fs-1 text-secondary"></i>
        </div>
      </div>
      <h3 class="fs-4 fw-semibold text-secondary mb-2">Aucun prospect actif</h3>
      <p class="text-muted mb-2">Les informations du prospect s'afficheront ici pendant un appel.</p>
      <p class="small text-muted fst-italic mt-3">Utilisez le composant de numérotation pour initier un appel.</p>
    </div>
  {:else}
    <!-- Always show the form during active calls or when prospect data is available -->
    <form on:submit|preventDefault={handleSubmit}>
      <!-- Header with lead ID if available -->
      <div class="card-header bg-primary text-white">
        <div class="d-flex justify-content-between align-items-center">
          <h5 class="mb-0 d-flex align-items-center">
            <i class="bi bi-person-vcard me-2"></i>
            Fiche Prospect
          </h5>
          {#if formData.lead_id}
            <span class="badge bg-light text-primary rounded-pill">
              ID: {formData.lead_id}
            </span>
          {/if}
        </div>
      </div>
      
      <div class="card-body">
        <!-- Main information section -->
        <div class="mb-4 pb-3 border-bottom">
          <h5 class="mb-3 d-flex align-items-center">
            <i class="bi bi-person-fill me-2 text-primary"></i>
            Informations principales
          </h5>
          <div class="row mb-3">
            <div class="col-md-6 mb-3 mb-md-0">
              <label for="first_name" class="form-label">Prénom</label>
              <div class="input-group">
                <span class="input-group-text"><i class="bi bi-person"></i></span>
                <input 
                  type="text" 
                  id="first_name" 
                  class="form-control"
                  value={formData.first_name || ''} 
                  on:input={e => handleInputChange('first_name', e)}
                />
              </div>
            </div>
            <div class="col-md-6">
              <label for="last_name" class="form-label">Nom</label>
              <div class="input-group">
                <span class="input-group-text"><i class="bi bi-person"></i></span>
                <input 
                  type="text" 
                  id="last_name" 
                  class="form-control"
                  value={formData.last_name || ''} 
                  on:input={e => handleInputChange('last_name', e)}
                />
              </div>
            </div>
          </div>
          
          <div class="row mb-3">
            <div class="col-md-6 mb-3 mb-md-0">
              <label for="email" class="form-label">Email</label>
              <div class="input-group">
                <span class="input-group-text"><i class="bi bi-envelope"></i></span>
                <input 
                  type="email" 
                  id="email" 
                  class="form-control"
                  value={formData.email || ''} 
                  on:input={e => handleInputChange('email', e)}
                />
              </div>
            </div>
            <div class="col-md-6">
              <label for="phone_number" class="form-label">Téléphone</label>
              <div class="input-group">
                <span class="input-group-text"><i class="bi bi-telephone"></i></span>
                <input 
                  type="tel" 
                  id="phone_number" 
                  class="form-control"
                  value={formData.phone_number || ''} 
                  on:input={e => handleInputChange('phone_number', e)}
                />
              </div>
            </div>
          </div>
        </div>
      
        <!-- Address section with Bootstrap styling -->  
        <div class="mb-4 pb-3 border-bottom">
          <h5 class="mb-3 d-flex align-items-center">
            <i class="bi bi-geo-alt me-2 text-primary"></i>
            Adresse
          </h5>
          
          <div class="mb-3">
            <label for="address1" class="form-label">Adresse</label>
            <div class="input-group">
              <span class="input-group-text"><i class="bi bi-house"></i></span>
              <input 
                type="text" 
                id="address1" 
                class="form-control"
                value={formData.address1 || ''} 
                on:input={e => handleInputChange('address1', e)}
              />
            </div>
          </div>
          
          <div class="row mb-3">
            <div class="col-md-6 mb-3 mb-md-0">
              <label for="city" class="form-label">Ville</label>
              <div class="input-group">
                <span class="input-group-text"><i class="bi bi-building"></i></span>
                <input 
                  type="text" 
                  id="city" 
                  class="form-control"
                  value={formData.city || ''} 
                  on:input={e => handleInputChange('city', e)}
                />
              </div>
            </div>
            <div class="col-md-6">
              <label for="state" class="form-label">Région</label>
              <div class="input-group">
                <span class="input-group-text"><i class="bi bi-map"></i></span>
                <input 
                  type="text" 
                  id="state" 
                  class="form-control"
                  value={formData.state || ''} 
                  on:input={e => handleInputChange('state', e)}
                />
              </div>
            </div>
          </div>
          
          <div class="row">
            <div class="col-md-6 mb-3 mb-md-0">
              <label for="postal_code" class="form-label">Code postal</label>
              <div class="input-group">
                <span class="input-group-text"><i class="bi bi-mailbox"></i></span>
                <input 
                  type="text" 
                  id="postal_code" 
                  class="form-control"
                  value={formData.postal_code || ''} 
                  on:input={e => handleInputChange('postal_code', e)}
                />
              </div>
            </div>
            <div class="col-md-6">
              <label for="country_code" class="form-label">Pays</label>
              <div class="input-group">
                <span class="input-group-text"><i class="bi bi-globe"></i></span>
                <input 
                  type="text" 
                  id="country_code" 
                  class="form-control"
                  value={formData.country_code || ''} 
                  on:input={e => handleInputChange('country_code', e)}
                />
              </div>
            </div>
          </div>
        </div>
        
        <!-- Additional information section with Bootstrap styling -->
        <div class="mb-4">
          <h5 class="mb-3 d-flex align-items-center">
            <i class="bi bi-info-circle me-2 text-primary"></i>
            Informations complémentaires
          </h5>
          
          <div class="mb-3">
            <label for="comments" class="form-label">Commentaires</label>
            <textarea 
              id="comments" 
              rows="3" 
              class="form-control"
              value={formData.comments || ''} 
              on:input={e => handleInputChange('comments', e)}
            ></textarea>
          </div>
          
          <div class="row">
            <div class="col-md-6 mb-3 mb-md-0">
              <label for="vendor_lead_code" class="form-label">Code vendeur</label>
              <div class="input-group">
                <span class="input-group-text"><i class="bi bi-tag"></i></span>
                <input 
                  type="text" 
                  id="vendor_lead_code" 
                  class="form-control"
                  value={formData.vendor_lead_code || ''} 
                  on:input={e => handleInputChange('vendor_lead_code', e)}
                />
              </div>
            </div>
            <div class="col-md-6">
              <label for="source_id" class="form-label">Source</label>
              <div class="input-group">
                <span class="input-group-text"><i class="bi bi-funnel"></i></span>
                <input 
                  type="text" 
                  id="source_id" 
                  class="form-control"
                  value={formData.source_id || ''} 
                  on:input={e => handleInputChange('source_id', e)}
                />
              </div>
            </div>
          </div>
        </div>
        
        <!-- Form actions with Bootstrap styling -->
        <div class="d-flex justify-content-end">
          <button type="submit" class="btn btn-primary">
            <i class="bi bi-save me-2"></i>
            Enregistrer
          </button>
        </div>
      </div>
    </form>
  {/if}
</div>

<style>
  /* All styling is handled by Bootstrap */
</style>
