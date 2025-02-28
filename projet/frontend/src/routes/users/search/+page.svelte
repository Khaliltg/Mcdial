<script>
    let userNumber = '';
    let fullName = '';
    let userLevel = '';
    let userGroup = '';
  
    const handleSearch = () => {
        alert('Searching for user...');
    };
  </script>
  
  <style>
    .container {
        max-width: 100%;
        margin: 50px auto;
        padding: 20px;
        border: 1px solid #ccc;
        border-radius: 5px;
        background-color: #f9f9f9;
    }
    .form-group {
        margin-bottom: 15px;
    }
    label {
        display: block;
        margin-bottom: 5px;
        font-weight: bold;
    }
    input, select {
        width: 100%;
        padding: 8px;
        box-sizing: border-box;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-size: 16px;
    }
    .search-btn {
        background-color: #4CAF50;
        color: white;
        padding: 10px 15px;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-size: 16px;
    }
    .search-btn:hover {
        background-color: #45a049;
    }
  </style>
  
  <div class="container">
    <h2>SEARCH FOR A USER</h2>
    <div class="form-group">
        <label>User Number:</label>
        <input type="text" bind:value={userNumber} placeholder="Enter user number">
    </div>
    <div class="form-group">
        <label>Full Name:</label>
        <input type="text" bind:value={fullName} placeholder="Enter full name">
    </div>
    <div class="form-group">
        <label>User Level:</label>
        <input type="number" bind:value={userLevel} min="0">
    </div>
    <div class="form-group">
        <label>User Group:</label>
        <select bind:value={userGroup}>
           
                <option value='yes'>ADMIN_VICIDIAL_ADMINISTRATORS </option>
                <option value='no'>TEST_test</option>
        </select>
    </div>
    <button class="search-btn" on:click={handleSearch}>Search</button>
  </div>