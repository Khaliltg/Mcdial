<script>
    let phoneExtension = '';
    let dialPlanNumbers = '';
    let voicemailBox = '';
    let outboundCallerId = '';
    let serverIP = '';
    let agentScreenLogin = '';
    let loginPassword = '';
    let registrationPassword = '';
    let fullName = '';
    let selectedPhone = '';

    const phoneOptions = [
        { value: '', text: 'Select a Phone' },
        { value: 'ext100', text: 'Extension 100' },
        { value: 'ext101', text: 'Extension 101' },
        { value: 'server1', text: 'Server Main' }
    ];
    
    function handleSubmit() {
        alert('Form submitted!');
        // Add your form submission logic here
    }
</script>

<div class="form-container">
    <h1>📞 𝐂𝐨𝐩𝐢𝐞𝐫 𝐮𝐧 𝐭é𝐥é𝐩𝐡𝐨𝐧𝐞</h1>

    <form on:submit|preventDefault={handleSubmit}>
        <div class="form-section">
            <label for="phoneExtension">Phone Extension:</label>
            <input id="phoneExtension" type="text" bind:value={phoneExtension} />
        </div>
        
        <div class="form-section">
            <label for="dialPlanNumbers">Dial Plan Number:</label>
            <input id="dialPlanNumbers" type="text" bind:value={dialPlanNumbers} />
        </div>
        
        <div class="form-section">
            <label for="voicemailBox">Voicemail Box:</label>
            <input id="voicemailBox" type="text" bind:value={voicemailBox} />
        </div>
        
        <div class="form-section">
            <label for="outboundCallerId">Outbound Caller ID:</label>
            <input id="outboundCallerId" type="text" bind:value={outboundCallerId} />
        </div>
        
        <div class="form-section">
            <label for="serverIP">Server IP:</label>
            <input id="serverIP" type="text" bind:value={serverIP} />
        </div>
        
        <div class="form-section">
            <label for="agentScreenLogin">Agent Screen Login:</label>
            <input id="agentScreenLogin" type="text" bind:value={agentScreenLogin} />
        </div>

        <div class="form-section">
            <label for="loginPassword">Login Password:</label>
            <input id="loginPassword" type="password" bind:value={loginPassword} />
        </div>

        <div class="form-section">
            <label for="registrationPassword">Registration Password:</label>
            <input id="registrationPassword" type="password" bind:value={registrationPassword} />
        </div>

        <div class="form-section">
            <label for="fullName">Full Name:</label>
            <input id="fullName" type="text" bind:value={fullName} />
        </div>

        <div class="form-section">
            <label for="selectedPhone">Source Phone:</label>
            <select id="selectedPhone" bind:value={selectedPhone}>
                <option value="">Select a Phone</option>
                <option value="2000">2000, 51.68.1.151</option>
                <option value="2001">2001, 51.68.1.151</option>
                <option value="2002">2002, 51.68.1.151</option>
                <option value="2003">2003, 51.68.1.151</option>
                <option value="2004">2004, 51.68.1.151</option>
                <option value="2005">2005, 51.68.1.151</option>
                <option value="2006">2006, 51.68.1.151</option>
                <option value="2007">2007, 51.68.1.151</option>
                <option value="2008">2008, 51.68.1.151</option>
                <option value="2009">2009, 51.68.1.151</option>
                <option value="2010">2010, 51.68.1.151</option>
                <option value="2011">2011, 51.68.1.151</option>
                <option value="2012">2012, 51.68.1.151</option>
                <option value="2013">2013, 51.68.1.151</option>
                <option value="2014">2014, 51.68.1.151</option>
                <option value="2015">2015, 51.68.1.151</option>
                <option value="2016">2016, 51.68.1.151</option>
                <option value="2017">2017, 51.68.1.151</option>
                <option value="2018">2018, 51.68.1.151</option>
                <option value="2019">2019, 51.68.1.151</option>
                <option value="2020">2020, 51.68.1.151</option>
            </select>
        </div>
        
        <hr />
        
        <button type="submit" class="submit-button">SUBMIT</button>
        
        <div class="note">
            NOTE: Copying a phone will copy all the settings from the selected source phone, except for the settings entered above.
        </div>
    </form>
</div>

<style>
    body {
        background-color: #f4f4f4;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    .form-container {
    
      
        padding: 20px;
        background-color: white;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }
    
    h1 {
        color: #333;
        font-size: 24px;
        margin-bottom: 20px;
        text-align: center;
    }
    
    .form-section {
        margin-bottom: 20px;
    }
    
    label {
        display: block;
        margin-bottom: 5px;
        font-weight: bold;
        color: #444;
    }
    
    input[type="text"],
    input[type="password"],
    select {
        padding: 10px;
        width: 100%;
        border: 1px solid #ccc;
        border-radius: 4px;
        box-sizing: border-box;
        transition: border-color 0.3s;
    }
    
    input:focus, select:focus {
        border-color: #4CAF50;
        outline: none;
    }
    
    .submit-button {
        background-color: #4CAF50;
        color: white;
        padding: 10px 20px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 16px;
      
        margin-top: 20px;
    }
    
    .submit-button:hover {
        background-color: #45a049;
    }
    
    .note {
        margin-top: 20px;
        font-style: italic;
        color: #666;
        font-size: 14px;
    }
    
    hr {
        border: 0;
        height: 1px;
        background-color: #ddd;
        margin: 20px 0;
    }
</style>