<script>
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth.js';
  // @ts-nocheck
  import { onMount } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  
  let formData = {
    user: '',
    full_name: '',
    pass: '',
    user_level: 1,
    user_group: 'test',
    status: 'Active' // Added status to match the form
  };
  
  /**
   * @type {never[]}
   */
  let userGrp = [];
  
  // Form submission and validation states
  let isSubmitting = false;
  let showSuccess = false;
  let showError = false;
  let errorMessage = '';
  
  import { goto } from '$app/navigation';
  
  async function handleSubmit() {
    isSubmitting = true;
    showSuccess = false;
    showError = false;
    
    try {
      const response = await fetchWithAuth('http://localhost:8000/api/admin/user/create-users', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
  
      if (response.ok) {
        showSuccess = true;
        // Stockage de la notification dans localStorage pour l'afficher sur la page de liste
        localStorage.setItem('userNotification', JSON.stringify({
          type: 'success',
          message: `L'utilisateur ${formData.user} a été créé avec succès!`,
          timestamp: new Date().getTime()
        }));
        
        // Redirection vers la liste des utilisateurs après un court délai
        setTimeout(() => {
          goto('/users/list');
        }, 1500);
      } else {
        const errorData = await response.json();
        errorMessage = errorData.message || 'Échec de la création de l\'utilisateur';
        showError = true;
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      errorMessage = 'Une erreur est survenue lors de la soumission du formulaire.';
      showError = true;
    } finally {
      isSubmitting = false;
    }
    }
  
    onMount(async () => {
      try {
        const response = await fetchWithAuth('http://localhost:8000/api/admin/user/users-group');
        if (response.ok) {
          userGrp = await response.json();
        } else {
          console.error('Failed to fetch user groups');
          errorMessage = 'Failed to load user groups';
          showError = true;
        }
      } catch (error) {
        console.error('Error fetching user groups:', error);
        errorMessage = 'Error loading user groups';
        showError = true;
      }
    });
  
    function handleCancel() {
      window.location.href = '/users/list';
    }
  
    function handleReset() {
      resetForm();
    }
  
    function resetForm() {
      formData = {
        user: '',
        full_name: '',
        pass: '',
        user_level: 1,
        user_group: 'test',
        status: 'Active'
      };
      showSuccess = false;
      showError = false;
    }
    
    // Password strength variables
    let passwordStrength = 0;
    let passwordFeedback = '';
    
    function checkPasswordStrength(password) {
      // Simple password strength checker
      let strength = 0;
      
      if (password.length >= 8) strength += 1;
      if (/[A-Z]/.test(password)) strength += 1;
      if (/[0-9]/.test(password)) strength += 1;
      if (/[^A-Za-z0-9]/.test(password)) strength += 1;
      
      passwordStrength = strength;
      
      switch(strength) {
        case 0: passwordFeedback = 'Very weak'; break;
        case 1: passwordFeedback = 'Weak'; break;
        case 2: passwordFeedback = 'Fair'; break;
        case 3: passwordFeedback = 'Good'; break;
        case 4: passwordFeedback = 'Strong'; break;
        default: passwordFeedback = '';
      }
    }
    
    $: if (formData.pass) checkPasswordStrength(formData.pass);
  </script>
  
  <style>
  .page-title {
    color: #3a3a3a;
    font-weight: 600;
    margin-bottom: 1.5rem;
    border-bottom: 2px solid #f0f0f0;
    padding-bottom: 0.75rem;
  }
  
  .form-card {
    border: none;
    box-shadow: 0 0.5rem 1.5rem rgba(0, 0, 0, 0.05);
    border-radius: 0.75rem;
    overflow: hidden;
    transition: transform 0.3s, box-shadow 0.3s;
  }
  
  .form-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 1rem 2rem rgba(0, 0, 0, 0.1);
  }
  
  .card-header {
    background: linear-gradient(135deg, #4a6bff, #2541b2);
    border: none;
    padding: 1.25rem;
  }
  
  .form-label {
    font-weight: 500;
    color: #555;
    margin-bottom: 0.5rem;
    font-size: 0.9rem;
  }
  
  .form-control, .form-select {
    border: 1px solid #e0e0e0;
    border-radius: 0.5rem;
    padding: 0.75rem 1rem;
    transition: all 0.3s;
    box-shadow: none;
  }
  
  .form-control:focus, .form-select:focus {
    border-color: #4a6bff;
    box-shadow: 0 0 0 0.25rem rgba(74, 107, 255, 0.15);
  }
  
  .btn {
    border-radius: 0.5rem;
    padding: 0.75rem 1.5rem;
    font-weight: 500;
    transition: all 0.3s;
  }
  
  .btn-primary {
    background: linear-gradient(135deg, #4a6bff, #2541b2);
    border: none;
  }
  
  .btn-primary:hover {
    background: linear-gradient(135deg, #3a5bef, #1531a2);
    transform: translateY(-3px);
  }
  
  .btn-secondary {
    background-color: #f8f9fa;
    color: #495057;
    border: 1px solid #ddd;
  }
  
  .btn-secondary:hover {
    background-color: #e9ecef;
    color: #212529;
  }
  
  .btn-danger {
    background: linear-gradient(135deg, #ff4a4a, #b22525);
    border: none;
  }
  
  .btn-danger:hover {
    background: linear-gradient(135deg, #ef3a3a, #a21515);
  }
  
  .password-strength-meter {
    height: 5px;
    border-radius: 5px;
    margin-top: 5px;
    background-color: #e9ecef;
    overflow: hidden;
  }
  
  .password-strength-meter div {
    height: 100%;
    border-radius: 5px;
    transition: width 0.3s;
  }
  
  .password-feedback {
    font-size: 0.75rem;
    margin-top: 0.25rem;
  }
  
  .alert {
    border-radius: 0.5rem;
    border: none;
    box-shadow: 0 0.25rem 0.75rem rgba(0, 0, 0, 0.05);
  }
  
  .input-group-text {
    background-color: #f8f9fa;
    border-color: #e0e0e0;
  }
  
  /* Styles pour les notifications */
  .notification-toast {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 9999;
    max-width: 350px;
  }
  
  .form-section {
    padding: 1.5rem;
    border-bottom: 1px solid #f0f0f0;
  }
  
  .form-section:last-child {
    border-bottom: none;
  }
  
  .form-section-title {
    font-size: 1.1rem;
    font-weight: 500;
    color: #3a3a3a;
    margin-bottom: 1.25rem;
  }
</style>
  
  <div class="container py-5" in:fade={{ duration: 300, delay: 300 }}>
  <div class="row justify-content-center">
    <div class="col-lg-8 col-md-10">
      <h1 class="page-title text-center" in:fly={{ y: -20, duration: 400, delay: 200 }}>
        <i class="bi bi-person-plus-fill me-2"></i>Add New User
      </h1>
      
      {#if showSuccess}
        <div class="alert alert-success d-flex align-items-center" role="alert" transition:fade>
          <i class="bi bi-check-circle-fill me-2"></i>
          <div>User created successfully!</div>
        </div>
      {/if}
      
      {#if showError}
        <div class="alert alert-danger d-flex align-items-center" role="alert" transition:fade>
          <i class="bi bi-exclamation-triangle-fill me-2"></i>
          <div>{errorMessage}</div>
        </div>
      {/if}
      
      <div class="card form-card" in:fly={{ y: 20, duration: 400, delay: 400 }}>
        <div class="card-header text-white text-center">
          <h5 class="mb-0"><i class="bi bi-person-badge me-2"></i>User Registration</h5>
        </div>
        
        <form on:submit|preventDefault={handleSubmit}>
          <div class="form-section">
            <h6 class="form-section-title"><i class="bi bi-info-circle me-2"></i>Basic Information</h6>
            
            <div class="mb-4">
              <label for="user" class="form-label">Username</label>
              <div class="input-group">
                <span class="input-group-text"><i class="bi bi-person"></i></span>
                <input 
                  type="text" 
                  class="form-control" 
                  id="user" 
                  bind:value={formData.user} 
                  placeholder="Enter username" 
                  required
                >
              </div>
            </div>
            
            <div class="mb-4">
              <label for="full_name" class="form-label">Full Name</label>
              <div class="input-group">
                <span class="input-group-text"><i class="bi bi-person-vcard"></i></span>
                <input 
                  type="text" 
                  class="form-control" 
                  id="full_name" 
                  bind:value={formData.full_name} 
                  placeholder="Enter full name" 
                  required
                >
              </div>
            </div>
            
            <div class="mb-4">
              <label for="pass" class="form-label">Password</label>
              <div class="input-group">
                <span class="input-group-text"><i class="bi bi-key"></i></span>
                <input 
                  type="password" 
                  class="form-control" 
                  id="pass" 
                  bind:value={formData.pass} 
                  placeholder="Enter password" 
                  required
                >
              </div>
              
              {#if formData.pass}
                <div class="password-strength-meter mt-2">
                  <div style="width: {passwordStrength * 25}%; background-color: {passwordStrength === 0 ? '#dc3545' : passwordStrength === 1 ? '#ffc107' : passwordStrength === 2 ? '#6c757d' : passwordStrength === 3 ? '#0d6efd' : '#198754'}"></div>
                </div>
                <div class="password-feedback {passwordStrength === 0 ? 'text-danger' : passwordStrength === 1 ? 'text-warning' : passwordStrength === 2 ? 'text-secondary' : passwordStrength === 3 ? 'text-primary' : 'text-success'}">
                  {passwordFeedback} {passwordStrength < 3 ? '- Consider using a stronger password' : ''}
                </div>
              {/if}
            </div>
          </div>
          
          <div class="form-section">
            <h6 class="form-section-title"><i class="bi bi-shield-lock me-2"></i>Access & Permissions</h6>
            
            <div class="mb-4">
              <label for="user_level" class="form-label">User Level</label>
              <div class="input-group">
                <span class="input-group-text"><i class="bi bi-layers"></i></span>
                <select 
                  class="form-select" 
                  id="user_level" 
                  bind:value={formData.user_level}
                >
                  <option value="9">9: Administrator (Full Access)</option>
                  <option value="8">8: Manager (Limited Admin)</option>
                  <option value="1">1: Standard User</option>
                </select>
              </div>
              <small class="text-muted">Determines what features and settings the user can access</small>
            </div>

            <div class="mb-4">
              <label for="user_group" class="form-label">User Group</label>
              <div class="input-group">
                <span class="input-group-text"><i class="bi bi-people"></i></span>
                <select 
                  class="form-select" 
                  id="user_group" 
                  bind:value={formData.user_group}
                >
                  <option value="" disabled>Select a user group</option>
                  {#if userGrp.length === 0}
                    <option value="loading" disabled>Loading groups...</option>
                  {:else}
                    {#each userGrp as group}
                      <option value={group.user_group}>{group.user_group}</option>
                    {/each}
                  {/if}
                </select>
              </div>
              <small class="text-muted">Assigns the user to a specific team or department</small>
            </div>

            <div class="mb-4">
              <label for="status" class="form-label">Account Status</label>
              <div class="input-group">
                <span class="input-group-text"><i class="bi bi-toggle-on"></i></span>
                <select 
                  class="form-select" 
                  id="status" 
                  bind:value={formData.status}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <small class="text-muted">Controls whether the user can log in to the system</small>
            </div>
          </div>
          
          <div class="card-footer bg-light p-4">
            <div class="d-flex flex-wrap justify-content-between gap-2">
              <button type="submit" class="btn btn-primary" disabled={isSubmitting}>
                {#if isSubmitting}
                  <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  <span>Creating...</span>
                {:else}
                  <i class="bi bi-person-plus-fill me-2"></i>
                  <span>Create User</span>
                {/if}
              </button>
              
              <div>
                <button type="button" class="btn btn-secondary me-2" on:click={handleReset}>
                  <i class="bi bi-arrow-counterclockwise me-2"></i>Reset
                </button>
                
                <button type="button" class="btn btn-danger" on:click={handleCancel}>
                  <i class="bi bi-x-circle me-2"></i>Cancel
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
      
      <div class="text-center mt-4" in:fade={{ duration: 300, delay: 600 }}>
        <a href="/users/list" class="text-decoration-none">
          <i class="bi bi-arrow-left me-1"></i> Back to Users List
        </a>
      </div>
    </div>
  </div>
</div>