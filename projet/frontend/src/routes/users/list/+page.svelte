<script>
  import { onMount } from 'svelte';

  let users = [];
  let showAll = false; // Reactive variable to control the display
  
  onMount(async () => {
    try {
      const response = await fetch('http://localhost:8000/api/admin/user/allUsers'); // Replace with your API URL
      if (response.ok) {
        users = await response.json();
      } else {
        console.error('Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  });

  function showAllUsers() {
    showAll = !showAll; // Toggle between showing all users and only active users
   
  }

 

  
</script>

<div class="container-fluid py-4">
  <div class="row">
    <div class="col-12">
      <h1 class="mb-4 font-semibold">Show Users</h1>
      <div class="card shadow-sm">
        <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
          <a href="/users/add" class="btn btn-light btn-sm">
            <i class="bi bi-person-plus me-2"></i>Add New User
          </a>
          <a on:click="{showAllUsers}" class="btn btn-light btn-sm">
            <i class="bi bi-person-plus me-2"></i>
            {#if showAll}
              Show Active Users
            {:else}
              Show All Users
            {/if}
          </a>
        </div>
        <div class="card-body">
          <div class="table-responsive">
            <table class="table table-striped table-hover">
              <thead>
                <tr>
                 
                  <th>User Name</th>
                  <th>Full Name</th>
                  <th>User Level</th>
                  <th>Status</th>
                  <th>User Group</th>
                  <th>Phone Login</th>
                  <th>Phone Pass</th>
                </tr>
              </thead>
              <tbody>
                {#each users as user}
                  {#if showAll || user.active === 'Y'}
                    <tr>
                    
                      <td>{user.user}</td>
                      <td>{user.full_name}</td>
                      <td>{user.user_level}</td>
                      <td>{user.active}</td>
                      <td>{user.user_group}</td>
                      <td>{user.phone_login}</td>
                      <td>{user.phone_pass}</td>
                    </tr>
                  {/if}
                {/each}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
