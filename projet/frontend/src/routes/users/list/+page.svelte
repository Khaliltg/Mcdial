<script>
  import { onMount } from 'svelte';

  let users = [];

  onMount(async () => {
    try {
      const response = await fetch('http://localhost:8000/api/admin/user/allUsers'); // Remplacez par l'URL de votre API
      if (response.ok) {
        users = await response.json();
      } else {
        console.error('Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  });
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
                  <th>User ID</th>
                  <th>Full Name</th>
                  <th>user_level</th>
                  <th>user_group</th>
                  <th>phone_login</th>
                  <th>phone_pass</th>
                </tr>
              </thead>
              <tbody>
                {#each users as user}
                  <tr>
                    <td>{user.user}</td>
                    <td>{user.full_name}</td>
                    <td>{user.user_level}</td>
                    <td>
                      {user.user_group}
                    </td>
                    <td>
                    {user.phone_login}
                    </td>
                    <td>{user.phone_pass}</td>

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