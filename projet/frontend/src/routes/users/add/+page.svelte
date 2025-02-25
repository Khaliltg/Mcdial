<script>
  let formData = {
    name: '',
    email: '',
    password: '',
    role: 'User',
    status: 'Active'
  };

  function handleSubmit() {
    console.log('Submitting user:', formData);
    alert('User would be added in a real application');
  }

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
      name: '',
      email: '',
      password: '',
      role: 'User',
      status: 'Active'
    };
  }
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
              <label for="number" class="form-label">User Number</label>
              <input 
                type="text" 
                class="form-control" 
                id="number" 
                bind:value={formData.name} 
                placeholder="Enter user number" 
                required
              >
            </div>
            <div class="mb-3">
              <label for="name" class="form-label">Full Name</label>
              <input 
                type="text" 
                class="form-control" 
                id="name" 
                bind:value={formData.email} 
                placeholder="Enter full name" 
                required
              >
            </div>
            <div class="mb-3">
              <label for="password" class="form-label">Password</label>
              <input 
                type="password" 
                class="form-control" 
                id="password" 
                bind:value={formData.password} 
                placeholder="Enter password" 
                required
              >
            </div>
            <div class="mb-3">
              <label for="role" class="form-label">User Level</label>
              <select 
                class="form-select" 
                id="role" 
                bind:value={formData.role}
              >
                <option value="User">1: Test</option>
                <option value="Manager">8: Manager</option>
                <option value="Admin">9: Admin</option>
              </select>
            </div>

            <div class="mb-3">
              <label for="group" class="form-label">User Group</label>
              <select 
                class="form-select" 
                id="group" 
                bind:value={formData.role}
              >
                <option value="User">All Admin User Group</option>
                <option value="Manager">ADMIN-VICIDIAL ADMINISTRATORS</option>
                <option value="Admin">Test-test</option>
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