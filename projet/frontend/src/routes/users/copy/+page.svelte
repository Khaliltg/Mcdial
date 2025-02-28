<script>
  let NewUserNumber = '';
  let password = '';
  let fullName = '';
  let sourceUser = '';
  let errorMessage = '';

  const handleSubmit = () => {
      if (!NewUserNumber || !password || !fullName) {
          errorMessage = 'Please fill in all fields.';
          return;
      }
      if (password.length < 8) {
          errorMessage = 'Password must be at least 8 characters long.';
          return;
      }
      errorMessage = '';
      alert('User submitted!');
  };

  const getPasswordStrength = () => {
      if (password.length === 0) return 'None';
      if (password.length < 4) return 'Weak';
      if (password.length < 8) return 'Medium';
      return 'Strong';
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
      margin-bottom: 20px;
  }
  label {
      display: block;
      margin-bottom: 5px;
      font-weight: bold;
  }
  input {
      width: 100%;
      padding: 10px;
      box-sizing: border-box;
      border: 1px solid #ccc;
      border-radius: 4px;
      font-size: 16px;
  }
  .submit-btn {
      background-color: #4CAF50;
      color: white;
      padding: 12px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 16px;
  }
  .submit-btn:hover {
      background-color: #05720a;
  }
  .error-message {
      color: red;
      margin-bottom: 15px;
      text-align: center;
  }
  .password-strength {
      margin-top: 5px;
      font-size: 14px;
      color: #090de9;
  }
  .password-strength span {
      font-weight: bold;
  }
</style>

<div class="container">
  <h2>COPY USER </h2>
  {#if errorMessage}
      <div class="error-message">{errorMessage}</div>
  {/if}
  <div class="form-group">
      <label>New User Number:</label>
      <input type="text" bind:value={NewUserNumber} placeholder="Enter user number">
  </div>
  <div class="form-group">
      <label>Password:</label>
      <input type="password" bind:value={password} placeholder="Enter password">
   
  </div>
  <div class="form-group">
      <label>Full Name:</label>
      <input type="text" bind:value={fullName} placeholder="Enter full name">
  </div>
  <div class="form-group">
      <label>Source User:</label>
      <input type="text" value={sourceUser} >
  </div>
  <button class="submit-btn" on:click={handleSubmit}>SUBMIT</button>
</div>