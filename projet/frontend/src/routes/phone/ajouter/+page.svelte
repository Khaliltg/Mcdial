<script>
    let formData = {
        phoneExtension: '',
        dialPlanNumber: '',
        voicemailBox: '',
        outboundCallerID: '',
        adminUserGroup: '',
        serverIP: '',
        agentScreenLogin: '',
        loginPassword: '',
        registrationPassword: '',
        status: '',
        activeAccount: true,
        phoneType: '',
        fullName: '',
        clientProtocol: '',
        localGMT: '',
    };

    const handleSubmit = () => {
        console.log('Form submitted:', formData);
        // Add your form submission logic here
    };
</script>

<div class="phone-config-container">
    <h2>📞𝐀𝐣𝐨𝐮𝐭𝐞𝐫 𝐮𝐧 𝐧𝐨𝐮𝐯𝐞𝐚𝐮 𝐭é𝐥é𝐩𝐡𝐨𝐧𝐞</h2>
    
    <form on:submit|preventDefault={handleSubmit}>
        <div class="form-group">
            <label for="phoneExtension">Phone Extension:</label>
            <input id="phoneExtension" type="text" bind:value={formData.phoneExtension} />
        </div>
        
        <div class="form-group">
            <label for="dialPlanNumber">Dial Plan Number:</label>
            <input id="dialPlanNumber" type="text" bind:value={formData.dialPlanNumber} />
        </div>
        
        <div class="form-group">
            <label for="voicemailBox">Voicemail Box:</label>
            <input id="voicemailBox" type="text" bind:value={formData.voicemailBox} />
        </div>
        
        <div class="form-group">
            <label for="outboundCallerID">Outbound CallerID:</label>
            <input id="outboundCallerID" type="text" bind:value={formData.outboundCallerID} />
        </div>
        
        <div class="form-group">
            <label for="adminUserGroup">Admin User Group:</label>
            <select id="adminUserGroup" bind:value={formData.adminUserGroup}>
                <option>All Admin User Groups</option>
                <option>MC_LEAD - MC_LEAD</option>
                <!-- Add other options here if needed -->
            </select>
        </div>
        
        <div class="form-group">
            <label for="serverIP">Server IP:</label>
            <input id="serverIP" type="text" bind:value={formData.serverIP} readonly />
        </div>
        
        <div class="form-group">
            <label for="agentScreenLogin">Agent Screen Login:</label>
            <input id="agentScreenLogin" type="text" bind:value={formData.agentScreenLogin} />
        </div>
        
        <div class="form-group">
            <label for="loginPassword">Login Password:</label>
            <input id="loginPassword" type="password" bind:value={formData.loginPassword} />
        </div>
        
        <div class="form-group">
            <label for="registrationPassword">Registration Password:</label>
            <input id="registrationPassword" type="password" bind:value={formData.registrationPassword} />
        </div>
        
        <div class="form-group">
            <label for="status">Status:</label>
            <select id="status" bind:value={formData.status}>
                <option>ACTIVE</option>
                <option>INACTIVE</option>
            </select>
        </div>
        
        <div class="form-group">
            <label for="activeAccount">Active Account:</label>
            <select id="activeAccount" bind:value={formData.activeAccount}>
                <option value="true">Yes</option>
                <option value="false">No</option>
            </select>  
        </div>
        
        <div class="form-group">
            <label for="phoneType">Phone Type:</label>
            <input id="phoneType" type="text" bind:value={formData.phoneType} />
        </div>
        
        <div class="form-group">
            <label for="fullName">Full Name:</label>
            <input id="fullName" type="text" bind:value={formData.fullName} />
        </div>
        
        <div class="form-group">
            <label for="clientProtocol">Client Protocol:</label>
            <select id="clientProtocol" bind:value={formData.clientProtocol}>
                <option>SIP</option>
                <option>ZAP</option>
                <option>IAX 2</option>
                <option>EXTERNAL</option>
                <option>DAHDI</option>
                <!-- Add other protocols if needed -->
            </select>
        </div>
        
        <div class="form-group">
            <label>Local GMT:</label>
            <select id="localGMT" bind:value={formData.localGMT}> 
                <option>12.75</option>
                <option>12</option>
                <option>11</option>
                <option>10</option>    
                <option>9.50</option>
                <option>9</option>
                <option>8</option> 
                <option>7</option>
                <option>6.5</option>
                <option>6</option>
                <option>5.75</option>
                <option>5.50</option>
                <option>5</option>
                <option>4.50</option>
                <option>4</option>
                <option>3.50</option>
                <option>3</option>
                <option>2</option>
                <option>1</option>
                <option>0.00</option>
                <option>-1.00</option>
                <option>-2.00</option>
                <option>-3.00</option>    
                <option>-4.00</option>
                <option>-5.00</option>
                <option>-6.00</option>
                <option>-7.00</option>
                <option>-8.00</option>
                <option>-9.00</option>
                <option>-10.00</option>
                <option>-11.00</option>
                <option>-12.00</option>
                <option>-5.00</option>
            </select>
        </div>
        
        <button type="submit" class="submit-btn">SUBMIT</button>
    </form>
</div>

<style>
    body {
        background-color: #f4f4f4;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    .phone-config-container {
     
    
        padding: 20px;
        background-color: white;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }
    
    h2 {
        color: #333;
        margin-bottom: 20px;
        text-align: center;
    }
    
    .form-group {
        margin-bottom: 15px;
    }
    
    label {
        display: block;
        margin-bottom: 5px;
        font-weight: bold;
    }
    
    input[type="text"],
    input[type="password"],
    select {
        width: 100%;
        padding: 10px;
        border: 1px solid #ddd;
        border-radius: 5px;
        box-sizing: border-box;
        transition: border-color 0.3s;
    }
    
    input[readonly] {
        background-color: #f5f5f5;
    }
    
    input:focus, select:focus {
        border-color: #4CAF50;
        outline: none;
    }
    
    .submit-btn {
        background-color: #4CAF50;
        color: white;
        padding: 10px 15px;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-size: 16px;
        transition: background-color 0.3s;
       
    }
    
    .submit-btn:hover {
        background-color: #45a049;
    }
</style>