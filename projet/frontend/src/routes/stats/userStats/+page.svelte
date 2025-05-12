<script>
    import { onMount } from 'svelte';
    import { page } from '$app/stores';
    import { fetchWithAuth } from '$lib/utils/fetchWithAuth.js';

    let users = [];
    let userData = null;
    let loadingUsers = true;
    let loadingUserData = true;
    let usersError = null;
    let error = null;
    let selectedUser = null;
    let searchQuery = '';
  
    async function fetchUsers() {
      loadingUsers = true;
      usersError = null;
      try {
        const response = await fetchWithAuth(`http://localhost:8000/api/admin/user/allUsers`);
        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }
        users = await response.json();
      } catch (err) {
        console.error('Error fetching users:', err);
        usersError = err.message;
      } finally {
        loadingUsers = false;
      }
    }
  
    async function fetchUserStats(userId) {
      loadingUserData = true;
      error = null;
      try {
        const response = await fetchWithAuth(`http://localhost:8000/api/admin/user/userStats/${userId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }
        userData = await response.json();
      } catch (err) {
        console.error('Error fetching user data:', err);
        error = err.message;
      } finally {
        loadingUserData = false;
      }
    }
  
    function handleUserSelection(userId) {
      selectedUser = userId;
      fetchUserStats(userId);
    }
  
    function handleSearch(query) {
      searchQuery = query;
    }
  
    onMount(() => {
      fetchUsers();
    });
  </script>
  
  <style>
    :global(body) {
      background-color: #f9fafb;
      font-family: 'Arial', sans-serif;
      color: #334155;
    }
  
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }
  
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }
  
    .header h1 {
      text-align: left;
      color: #2563eb;
      margin-bottom: 0;
    }
  
    .header button {
      background-color: #2563eb;
      color: white;
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 0.25rem;
      cursor: pointer;
      transition: background 0.3s;
    }
  
    .header button:hover {
      background-color: #1d4ed8;
    }
  
    .search-bar {
      padding: 0.5rem;
      border: 1px solid #e5e7eb;
      border-radius: 0.25rem;
      width: 100%;
    }
  
    .search-bar input {
      padding: 0.5rem;
      border: none;
      width: 100%;
    }
  
    .user-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 2rem;
      background: white;
      border-radius: 0.5rem;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }
  
    .user-table th,
    .user-table td {
      padding: 1rem;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }
  
    .user-table th {
      background-color: #f1f5f9;
      color: #1e40af;
      font-weight: bold;
    }
  
    .user-row {
      cursor: pointer;
      transition: background 0.3s, transform 0.2s;
    }
  
    .user-row:hover {
      background-color: #e2e8f0;
      transform: scale(1.01);
    }
  
    .user-data {
      background: white;
      border-radius: 0.5rem;
      padding: 1.5rem;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }
  
    .section {
      margin-bottom: 2rem;
    }
  
    .section-title {
      font-size: 1.5rem;
      font-weight: bold;
      margin-bottom: 1rem;
      color: #1e40af;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 0.5rem;
    }
  
    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 1rem;
    }
  
    .info-item {
      padding: 1rem;
      background: #f0f4f8;
      border-radius: 0.5rem;
      box-shadow: 0 1px 5px rgba(0, 0, 0, 0.1);
      transition: transform 0.2s;
    }
  
    .info-item:hover {
      transform: translateY(-2px);
    }
  
    .info-label {
      font-weight: bold;
      color: #374151;
    }
  
    .info-value {
      color: #1f2937;
    }
  
    .stat-card {
      background: #e0f7fa;
      padding: 1rem;
      border-radius: 0.5rem;
      box-shadow: 0 1px 5px rgba(0, 0, 0, 0.1);
      margin-bottom: 1rem;
      transition: transform 0.2s;
      width: 250px;
    }
  
    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }
  
    .stat-title {
      font-weight: bold;
      color: #00796b;
      font-size: 1.25rem;
      margin-bottom: 0.5rem;
    }
  
    .stat-value {
      font-size: 1.5rem;
      font-weight: bold;
      color: #004d40;
    }
  
    .stat-label {
      color: #6c757d;
    }
  
    .stat-icon {
      font-size: 1.5rem;
      margin-right: 0.5rem;
    }
  
    .loading,
    .error {
      text-align: center;
      padding: 2rem;
      color: #dc2626;
    }
  
    .button {
      background-color: #2563eb;
      color: white;
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 0.25rem;
      cursor: pointer;
      transition: background 0.3s;
    }
  
    .button:hover {
      background-color: #1d4ed8;
    }
  </style>
  
  <div class="container">
    <div class="header">
      <h1>User Statistics</h1>
      {#if selectedUser}
        <button on:click={() => selectedUser = null}>Back to Users</button>
      {/if}
    </div>
  
    {#if !selectedUser}
      <div class="search-bar">
        <input type="text" placeholder="Search users..." on:input={(e) => handleSearch(e.target.value)} />
      </div>
  
      {#if loadingUsers}
        <div class="loading">Loading users...</div>
      {:else if usersError}
        <div class="error">{usersError}</div>
      {:else if users.length === 0}
        <p>No users found</p>
      {:else}
        <table class="user-table">
          <thead>
            <tr>
              <th>Full Name</th>
              <th>Username</th>
              <th>User Level</th>
              <th>User Group</th>
            </tr>
          </thead>
          <tbody>
            {#each users.filter((user) => user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || user.user.toLowerCase().includes(searchQuery.toLowerCase())) as user}
              <tr class="user-row" on:click={() => handleUserSelection(user.user)}>
                <td>{user.full_name || user.user}</td>
                <td>{user.user}</td>
                <td>{user.user_level}</td>
                <td>{user.user_group}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      {/if}
    {:else}
      <div class="user-data">
        {#if loadingUserData}
          <div class="loading">Loading user data...</div>
        {:else if error}
          <div class="error">{error}</div>
        {:else if userData}
          <div class="section">
            <h2 class="section-title">User Information</h2>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Full Name</div>
                <div class="info-value">{userData.userInfo.full_name}</div>
              </div>
              <div class="info-item">
                <div class="info-label">User Level</div>
                <div class="info-value">{userData.userInfo.user_level}</div>
              </div>
              <div class="info-item">
                <div class="info-label">User Group</div>
                <div class="info-value">{userData.userInfo.user_group}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Last Login</div>
                <div class="info-value">{userData.userInfo.last_login_date ? new Date(userData.userInfo.last_login_date).toLocaleString() : 'N/A'}</div>
              </div>
            </div>
          </div>
  
          <div class="section">
            <h2 class="section-title">Call Statistics</h2>
            <div class="info-grid">
              {#if userData.callData.length > 0}
                {#each userData.callData as call}
                  <div class="stat-card">
                    <div class="stat-title">Call Date</div>
                    <div class="stat-value">
                      <i class="stat-icon">&#x1F4C5;</i>
                      {new Date(call.call_date).toLocaleString()}
                    </div>
                    <div class="stat-title">Status</div>
                    <div class="stat-value">
                      <i class="stat-icon">&#x1F4CC;</i>
                      {call.status}
                    </div>
                    <div class="stat-title">Duration</div>
                    <div class="stat-value">
                      <i class="stat-icon">&#x1F552;</i>
                      {call.length_in_sec}s
                    </div>
                  </div>
                {/each}
              {:else}
                <div class="info-item">No call data available</div>
              {/if}
            </div>
          </div>
  
          <div class="section">
            <h2 class="section-title">Permissions</h2>
            <div class="info-grid">
              {#each Object.entries(userData.userInfo) as [key, value]}
                {#if key.startsWith('delete_') || key.startsWith('modify_') || key.startsWith('view_')}
                  <div class="info-item">
                    <div class="info-label">{key.replace('_', ' ').replace(/([A-Z])/g, ' $1')}</div>
                    <div class="info-value">{value === '1' || value === 1 ? 'Enabled' : 'Disabled'}</div>
                  </div>
                {/if}
              {/each}
            </div>
          </div>
  
          <div class="section">
            <h2 class="section-title">Actions</h2>
            <div class="info-grid">
              <div class="info-item">
                <button class="button" on:click={() => console.log('Edit user')}>Edit User</button>
              </div>
              <div class="info-item">
                <button class="button" on:click={() => console.log('Delete user')}>Delete User</button>
              </div>
            </div>
          </div>
        {:else}
          <p>No user data available</p>
        {/if}
      </div>
    {/if}
  </div>