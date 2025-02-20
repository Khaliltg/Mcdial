<script>
  let formData = {
    name: '',
    email: '',
    role: 'User',
    status: 'Active'
  };

  function handleSubmit() {
    // In a real app, this would send data to a backend
    console.log('Submitting user:', formData);
    alert('User would be added in a real application');
  }
</script>

<div class="container-fluid py-4">
  <div class="row">
    <div class="col-md-6 offset-md-3">
      <h1 class="mb-4 font-semibold">Add New User</h1>
      
      <div class="card shadow-sm">
        <div class="card-header bg-primary text-white">
          <h5 class="mb-0">User Registration</h5>
        </div>
        <div class="card-body">
          <form on:submit|preventDefault={handleSubmit}>
            <div class="mb-3">
              <label for="name" class="form-label">Full Name</label>
              <input 
                type="text" 
                class="form-control" 
                id="name" 
                bind:value={formData.name} 
                required
              >
            </div>
            <div class="mb-3">
              <label for="email" class="form-label">Email address</label>
              <input 
                type="email" 
                class="form-control" 
                id="email" 
                bind:value={formData.email} 
                required
              >
            </div>
            <div class="mb-3">
              <label for="role" class="form-label">User Role</label>
              <select 
                class="form-select" 
                id="role" 
                bind:value={formData.role}
              >
                <option value="User">User</option>
                <option value="Manager">Manager</option>
                <option value="Admin">Admin</option>
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
            <button type="submit" class="btn btn-primary">
              <i class="bi bi-person-plus me-2"></i>Create User
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
</div>