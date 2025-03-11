<script>
    let startDate = '';
    let endDate = '';
    let status = '';
    let user = '';
  
    function handleSubmit() {
      alert(`Start Date: ${startDate}\nEnd Date: ${endDate}\nStatus: ${status}\nUser: ${user}`);
    }
  </script>
  
  <style>
    .container {
      padding: 10px;
      border-radius: 5px;
      margin: 0 auto;
     
    }
  
    .form-row {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 10px;
    }
  
    input {
      padding: 10px;
      border: 1px solid #424141;
      border-radius: 5px;
      flex: 1;
    }
  
    button {
      padding: 10px 20px;
      background-color: #007BFF;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      margin-left: 10px;
    }
  
    button:hover {
      background-color: #0056b3;
    }
  </style>
  
  <div class="container">
    <h2>𝐔𝐬𝐞𝐫 𝐒𝐭𝐚𝐭𝐬 𝐅𝐨𝐫𝐦</h2>
    <div class="form-row">
      <input type="date" bind:value={startDate} placeholder="Start Date">
      <input type="date" bind:value={endDate} placeholder="End Date">
      <input type="text" bind:value={status} placeholder="Status">
      <input type="text" bind:value={user} placeholder="User">
      <button on:click={handleSubmit}>Submit</button>
    </div>
  </div>