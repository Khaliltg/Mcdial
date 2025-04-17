<script>
  import { fetchWithAuth } from '$lib/utils/fetchWithAuth.js';
  // @ts-nocheck
  
      import { onMount } from 'svelte';
  
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
  
  
    
    async function handleSubmit() {
      try {
        const response = await fetchWithAuth('http://localhost:8000/api/admin/user/create-users', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
  
        if (response.ok) {
          alert('User created successfully!');
          resetForm(); // Reset the form after successful submission
        } else {
          const errorData = await response.json();
          alert(`Error: ${errorData.message}`);
        }
      } catch (error) {
        console.error('Error submitting form:', error);
        alert('An error occurred while submitting the form.');
      }
    }
  
    onMount(async () => {
      try {
        const response = await fetchWithAuth('http://localhost:8000/api/admin/user/users-group'); // Replace with your API URL
        if (response.ok) {
          userGrp = await response.json();
          console.log(userGrp);
          
        } else {
          console.error('Failed to fetch users');
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    });
  
  
    function handleCancel() {
      resetForm();
      alert('Form has been reset');
    }
  
    function handleReset() {
      const confirmReset = confirm("Are you sure you want to reset the form?");
      if (confirmReset) {
        resetForm();
      }
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
    }
   
    console.log(userGrp);
    
  </script>
  
  <style>
    .form-label {
      font-weight: bold;
    }
    .form-control {
      border-radius: 0.25rem;
    }
    .btn {
      transition: background-color 0.3s, transform 0.2s;
    }
    .btn:hover {
      background-color: #0056b3;
      transform: translateY(-2px);
    }
    .btn-cancel {
      background-color: #dc3545; /* Bootstrap danger color */
      color: white;
    }
    .btn-cancel:hover {
      background-color: #c82333; /* Darker red on hover */
    }
  </style>
  
  <div class="container-fluid py-4">
    <div class="row">
      <div class="col-md-8 offset-md-2">
        <h1 class="mb-4 text-center">Add New User</h1>
        
        <div class="card shadow-sm">
          <div class="card-header bg-primary text-white text-center">
            <h5 class="mb-0">User Registration</h5>
          </div>
          <div class="card-body">
            <form on:submit|preventDefault={handleSubmit}>
              <div class="mb-3">
                <label for="number" class="form-label">User</label>
                <input 
                  type="text" 
                  class="form-control" 
                  id="user" 
                  bind:value={formData.user} 
                  placeholder="Enter user number" 
                  required
                >
              </div>
              <div class="mb-3">
                <label for="name" class="form-label">Full Name</label>
                <input 
                  type="text" 
                  class="form-control" 
                  id="full_name" 
                  bind:value={formData.full_name} 
                  placeholder="Enter full name" 
                  required
                >
              </div>
              <div class="mb-3">
                <label for="password" class="form-label">Password</label>
                <input 
                  type="password" 
                  class="form-control" 
                  id="pass" 
                  bind:value={formData.pass} 
                  placeholder="Enter password" 
                  required
                >
              </div>
              <div class="mb-3">
                <label for="role" class="form-label">User Level</label>
                <select 
                  class="form-select" 
                  id="user_level" 
                  bind:value={formData.user_level}
                >
                  <option value="9">9: Admin </option>
                  <option value="8">8: Manager</option>
                  <option value="1">1: Test</option>
                </select>
              </div>
  
              <div class="mb-3">
                <label for="group" class="form-label">User Group</label>
                <select 
                  class="form-select" 
                  id="user_group" 
                  bind:value={formData.user_group}
                >
                  <option value="" disabled>Select a user group</option>
                  {#each userGrp as group}
                    <option value={group.user_group}>{group.user_group}</option>
                  {/each}
                </select>
              </div>
  
              <div class="mb-3">
                <label for="status" class="form-label">Account Status</label>
                <select 
                  class="form-select" 
                  id="status" 
                  bind:value={formData.status}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div class="d-flex justify-content-between">
                <button type="submit" class="btn btn-primary">
                  <i class="bi bi-person-plus me-2"></i>Submit 
                </button>
                <button type="button" class="btn btn-secondary" on:click={handleReset}>
                  <i class="bi bi-arrow-counterclockwise me-2"></i>Reset
                </button>
                <a href="/users/list"><button type="button" class="btn btn-cancel" on:click={handleCancel}>
                  <i class="bi bi-x-circle me-2"></i>Cancel
                </button></a>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>