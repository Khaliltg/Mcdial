<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  let users = [];
  let showAll = false;

  // Fetch the list of users when the component mounts
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

  // Function to toggle between showing all users or just active ones
  function showAllUsers() {
    showAll = !showAll;
  }

  // Function to navigate to the detail page with the userId as a query parameter
  function navigateToUserDetail(userId) {
    goto(`/users/detail?id=${userId}`); // Navigate to the detail page
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
          <a on:click={showAllUsers} class="btn btn-light btn-sm">
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
                      <td>
                        <a href="javascript:void(0)" on:click={() => navigateToUserDetail(user.user_id)}>
                          {user.user}
                        </a>
                      </td>
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