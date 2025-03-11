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
        border: 1px solid #000000;
        border-radius: 5px;
        background-color: #ffffff;
        color: #090de9;
    }
    .form-group {
        margin-bottom: 20px;
    }
    label {
        display: block;
        margin-bottom: 5px;
        font-weight: bold;
    }
    input, select {
        width: 100%;
        padding: 10px;
        box-sizing: border-box;
        border: 1px solid #5341f5;
        border-radius: 4px;
        font-size: 16px;
    }
    .search-btn {
        background-color: #291bf7;
        color: white;
        padding: 12px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 16px;
    }
    .search-btn:hover {
        background-color: #0c4acf;
    }
    .error-message {
        color: red;
        margin-bottom: 15px;
        text-align: center;
    }
    .password-strength {
        margin-top: 5px;
        font-size: 14px;
        color: #080818;
    }
    .password-strength span {
        font-weight: bold;
    }
</style>
<h2>𝐒𝐞𝐚𝐫𝐜𝐡 𝐅𝐨𝐫 𝐔𝐬𝐞𝐫</h2>
  <div class="container">
  
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