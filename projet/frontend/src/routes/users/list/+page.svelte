<script>
  // Simulated user data - in a real app, this would come from an API
  const users = [
    { 
      id: 1, 
      name: 'John Doe', 
      email: 'john@example.com', 
      role: 'Admin',
      status: 'Active'
    },
    { 
      id: 2, 
      name: 'Jane Smith', 
      email: 'jane@example.com', 
      role: 'Manager',
      status: 'Active'
    },
    { 
      id: 3, 
      name: 'Bob Johnson', 
      email: 'bob@example.com', 
      role: 'User',
      status: 'Inactive'
    }
  ];
</script>

<div class="container-fluid py-4">
  <div class="row">
    <div class="col-12">
      <h1 class="mb-4 font-semibold">Show Users</h1>
      
      <div class="card shadow-sm">
        <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
          <h5 class="mb-0">User List</h5>
          <a href="/users/add" class="btn btn-light btn-sm">
            <i class="bi bi-person-plus me-2"></i>Add New User
          </a>
        </div>
        <div class="card-body">
          <div class="table-responsive">
            <table class="table table-striped table-hover">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {#each users as user}
                  <tr>
                    <td>{user.id}</td>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>
                      <span class="badge bg-{user.role === 'Admin' ? 'danger' : user.role === 'Manager' ? 'warning' : 'secondary'}">
                        {user.role}
                      </span>
                    </td>
                    <td>
                      <span class="badge bg-{user.status === 'Active' ? 'success' : 'secondary'}">
                        {user.status}
                      </span>
                    </td>
                    <td>
                      <div class="btn-group" role="group">
                        <button class="btn btn-sm btn-outline-primary">
                          <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger">
                          <i class="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>