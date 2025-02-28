<script>
  let user = {
    userNumber: '',
    password: '',
    forceChangePassword: '',
    lastLoginInfo: '',
    fullName: '',
    userLevel: '',
    userGroup: '',
    phoneLogin: '',
    phonePass: '',
    active: '',
    voicemailID: '',
    email: '',
    mobileNumber: '',
    userCode: '',
    userLocation: 'default',
    vermSecondaryUserGroup: 'UNDEFINED~',
    mainTerritory: '',
    userNickname: '',
    agentChooseIngroups: 1,
    agentChooseBlended: 1,
    hotKeysActive: 0,
    scheduledCallbacks: 0,
    agentOnlyCallbacks: 0,
    nextDialMyCallbacksOverride: 'NOT_ACTIVE',
    agentCallManual: 0,
    manualDialFilterOverride: 'DISABLED',
    agentRecording: 1,
    agentTransfers: 1,
    closerDefaultBlended: 0,
    agentRecordingOverride: 'DISABLED',
    agentAlterCustomerDataOverride: 'NOT_ACTIVE',
    agentAlterCustomerPhoneOverride: 'NOT_ACTIVE',
    agentShiftEnforcementOverride: 'DISABLED',
    agentCallLogViewOverride: 'DISABLED',
    campaignHideCallLogOverride: 'DISABLED',
    agentLeadSearchOverride: 'NOT_ACTIVE',
    leadFilter: 'NONE',
    alertEnabled: 0,
    allowAlerts: 0,
    PresetContactSearch: 0
  };

  function updateUser() {
    console.log('Updated User:', user);
  }
</script>

<style>
  body {
    font-family: Arial, sans-serif;
    background-color: #f4f4f4;
    margin: 0;
    padding: 20px;
  }

  form {
    width: 100%;

  }

  h2 {
    color: #291beb;
    border-bottom: 2px solid #0804f5;
    padding-bottom: 10px;
    margin-top: 20px;
  }

  label {
    display: block;
    margin-bottom: 15px;
    font-weight: bold;
    color: #555;
  }

  input, select {
    width: 100%;
    padding: 10px;
    margin-top: 5px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
  }

  input:focus, select:focus {
    border-color: #4CAF50;
    outline: none;
  }

  button {
    background-color: #4CAF50;
    color: white;
    padding: 12px 20px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
    margin-top: 20px;

  }

  button:hover {
    background-color: #12af66;
  }

  .form-section {
   margin-bottom: 30px;
  }

  .tooltip {
    font-size: 12px;
    color: #888;
    margin-top: 5px;
  }
</style>

<form on:submit|preventDefault={updateUser}>
    <div class="form-section">
        <h2>User Information</h2>
        <div style="display: flex; gap: 20px;">
          
          <!-- Colonne 1 -->
          <div style="flex: 1;">
            <label>
              User Number:
              <input bind:value={user.userNumber} placeholder="Enter user number" />
            </label>
            <label>
              Password:
              <input type="password" bind:value={user.password} placeholder="Enter password" />
            </label>
            <label>
              Force Change Password:
              <select bind:value={user.forceChangePassword}>
                <option value="Y">Yes</option>
                <option value="N">No</option>
              </select>
            </label>
            <label>
              Phone Pass:
              <input bind:value={user.phonePass} placeholder="Enter phone password" />
            </label>
            <label>
              Phone Login:
              <input bind:value={user.phoneLogin} placeholder="Enter phone login" />
            </label>
            
            <label>
              Active:
              <select bind:value={user.active}>
                <option value="Y">Yes</option>
                <option value="N">No</option>
              </select>
            </label>
            <label>
              User Level:
              <input type="number" bind:value={user.userLevel} placeholder="Enter user level" />
            </label>
            <label>
              User Group:
              <input bind:value={user.userGroup} placeholder="Enter user group" />
            </label>
            <label>
              VERM Secondary User Group:
              <select bind:value={user.vermSecondaryUserGroup}>
                <option value="UNDEFINED">UNDEFINED</option>
                <option value="ADMIN-VICIDAL ADMINISTRATORS">ADMIN-VICIDAL ADMINISTRATORS</option>
                <option value="Test-test">Test-test</option>
              </select>
            </label>
          </div>
      
          <!-- Colonne 2 -->
          <div style="flex: 1;">
            <label>
              Full Name:
              <input bind:value={user.fullName} placeholder="Enter full name" />
            </label>
            <label>
              User Code:
              <input bind:value={user.userCode} placeholder="Enter user code" />
            </label>
            <label>
              Email:
              <input type="email" bind:value={user.email} placeholder="Enter email" />
            </label>
            <label>
              Mobile Number:
              <input type="tel" bind:value={user.mobileNumber} placeholder="Enter mobile number" />
            </label>
            <label>
              User Nickname:
              <input bind:value={user.userNickname} placeholder="Enter user nickname" />
            </label>
      
            <label>
              Last Login Info:
              <input bind:value={user.lastLoginInfo} placeholder="Enter last login info" />
            </label>
            <label>
              Voicemail ID:
              <input bind:value={user.voicemailID} placeholder="Enter voicemail ID" />
            </label>
            <label>
              User Location:
              <select bind:value={user.userLocation}>
                <option value="default">Default</option>
              </select>
            </label>
            <label>
              Main Territory:
              <input bind:value={user.mainTerritory} placeholder="Enter main territory" />
            </label>
          </div>
          
        </div>
      </div>
      

    <div class="form-section">
        <h2>Agent Interface Options</h2>
        <div style="display: flex; gap: 20px;">
          <!-- Colonne 1 -->
          <div style="flex: 1;">
            <label>
              Agent Choose Ingroups:
              <input type="number" bind:value={user.agentChooseIngroups} placeholder="Enter value" />
            </label>
            <label>
              Agent Choose Blended:
              <input type="number" bind:value={user.agentChooseBlended} placeholder="Enter value" />
            </label>
            <label>
              Hot Keys Active:
              <input type="number" bind:value={user.hotKeysActive} placeholder="Enter value" />
            </label>
            <label>
              Scheduled Callbacks:
              <input type="number" bind:value={user.scheduledCallbacks} placeholder="Enter value" />
            </label>
            <label>
              Agent-Only Callbacks:
              <input type="number" bind:value={user.agentOnlyCallbacks} placeholder="Enter value" />
            </label>
            <label>
              Next-Dial My Callbacks Override:
              <select bind:value={user.nextDialMyCallbacksOverride}>
                <option value="Notactive">NOT-ACTIVE</option>
                <option value="ENABLED">ENABLED</option>
                <option value="disabled">DISABLED</option>
              </select>
            </label>
            <label>
              Agent Call Manual:
              <input type="number" bind:value={user.agentCallManual} placeholder="Enter value" />
            </label>
            <label>
              Manual Dial Filter Override:
              <select bind:value={user.manualDialFilterOverride}>
                <option value="DISABLED">DISABLED</option>
                <option value="NONE">NONE</option>
                <option value="DNC_ONLY">DNC_ONLY</option>
                <option value="CAMPDNC_ONLY">CAMPDNC_ONLY</option>
                <option value="INTERNALDNC_ONLY">INTERNALDNC_ONLY</option>
                <option value="DNC_AND_CAMPDNC">DNC_AND_CAMPDNC</option>
                <option value="CAMPLISTS_ONLY">CAMPLISTS_ONLY</option>
                <option value="CAMPLISTS_ALL">CAMPLISTS_ALL</option>
                <option value="SYSTEM">SYSTEM</option>
				<option value="DNC_AND_CAMPLISTS">DNC_AND_CAMPLISTS</option>
				<option value="CAMPDNC_ONLY_AND_CAMPLISTS">CAMPDNC_ONLY_AND_CAMPLISTS</option>
				<option value="INTERNALDNC_ONLY_AND_CAMPLISTS">INTERNALDNC_ONLY_AND_CAMPLISTS</option>
				<option value="DNC_AND_CAMPDNC_AND_CAMPLISTS">DNC_AND_CAMPDNC_AND_CAMPLISTS</option>
				<option value="DNC_AND_CAMPLISTS_ALL">DNC_AND_CAMPLISTS_ALL</option>
				<option value="CAMPDNC_ONLY_AND_CAMPLISTS_ALL">CAMPDNC_ONLY_AND_CAMPLISTS_ALL</option>
				<option value="INTERNALDNC_ONLY_AND_CAMPLISTS_ALL">INTERNALDNC_ONLY_AND_CAMPLISTS_ALL</option>
				<option value="DNC_AND_CAMPDNC_AND_CAMPLISTS_ALL">DNC_AND_CAMPDNC_AND_CAMPLISTS_ALL</option>
				<option value="DNC_AND_SYSTEM">DNC_AND_SYSTEM</option>
				<option value="CAMPDNC_ONLY_AND_SYSTEM">CAMPDNC_ONLY_AND_SYSTEM</option>
				<option value="INTERNALDNC_ONLY_AND_SYSTEM">INTERNALDNC_ONLY_AND_SYSTEM</option>
				<option value="DNC_AND_CAMPDNC_AND_SYSTEM">DNC_AND_CAMPDNC_AND_SYSTEM</option>
				<option value="NONE_WITH_ALT">NONE_WITH_ALT</option>
				<option value="DNC_ONLY_WITH_ALT">DNC_ONLY_WITH_ALT</option>
				<option value="CAMPDNC_ONLY_WITH_ALT">CAMPDNC_ONLY_WITH_ALT</option>
				<option value="INTERNALDNC_ONLY_WITH_ALT">INTERNALDNC_ONLY_WITH_ALT</option>
				<option value="DNC_AND_CAMPDNC_WITH_ALT">DNC_AND_CAMPDNC_WITH_ALT</option>
				<option value="CAMPLISTS_ONLY_WITH_ALT">CAMPLISTS_ONLY_WITH_ALT</option>
				<option value="CAMPLISTS_ALL_WITH_ALT">CAMPLISTS_ALL_WITH_ALT</option>
				<option value="SYSTEM_WITH_ALT">SYSTEM_WITH_ALT</option>
				<option value="DNC_AND_CAMPLISTS_WITH_ALT">DNC_AND_CAMPLISTS_WITH_ALT</option>
				<option value="CAMPDNC_ONLY_AND_CAMPLISTS_WITH_ALT">CAMPDNC_ONLY_AND_CAMPLISTS_WITH_ALT</option>
				<option value="INTERNALDNC_ONLY_AND_CAMPLISTS_WITH_ALT">INTERNALDNC_ONLY_AND_CAMPLISTS_WITH_ALT</option>
				<option value="DNC_AND_CAMPDNC_AND_CAMPLISTS_WITH_ALT">DNC_AND_CAMPDNC_AND_CAMPLISTS_WITH_ALT</option>
				<option value="DNC_AND_CAMPLISTS_ALL_WITH_ALT">DNC_AND_CAMPLISTS_ALL_WITH_ALT</option>
				<option value="CAMPDNC_ONLY_AND_CAMPLISTS_ALL_WITH_ALT">CAMPDNC_ONLY_AND_CAMPLISTS_ALL_WITH_ALT</option>
				<option value="INTERNALDNC_ONLY_AND_CAMPLISTS_ALL_WITH_ALT">INTERNALDNC_ONLY_AND_CAMPLISTS_ALL_WITH_ALT</option>
				<option value="DNC_AND_CAMPDNC_AND_CAMPLISTS_ALL_WITH_ALT">DNC_AND_CAMPDNC_AND_CAMPLISTS_ALL_WITH_ALT</option>
				<option value="DNC_AND_SYSTEM_WITH_ALT">DNC_AND_SYSTEM_WITH_ALT</option>
				<option value="CAMPDNC_ONLY_AND_SYSTEM_WITH_ALT">CAMPDNC_ONLY_AND_SYSTEM_WITH_ALT</option>
				<option value="INTERNALDNC_ONLY_AND_SYSTEM_WITH_ALT">INTERNALDNC_ONLY_AND_SYSTEM_WITH_ALT</option>
				<option value="DNC_AND_CAMPDNC_AND_SYSTEM_WITH_ALT">DNC_AND_CAMPDNC_AND_SYSTEM_WITH_ALT</option>
				<option value="NONE_WITH_ALT_ADDR3">NONE_WITH_ALT_ADDR3</option>
				<option value="DNC_ONLY_WITH_ALT_ADDR3">DNC_ONLY_WITH_ALT_ADDR3</option>
				<option value="CAMPDNC_ONLY_WITH_ALT_ADDR3">CAMPDNC_ONLY_WITH_ALT_ADDR3</option>
				<option value="INTERNALDNC_ONLY_WITH_ALT_ADDR3">INTERNALDNC_ONLY_WITH_ALT_ADDR3</option>
				<option value="DNC_AND_CAMPDNC_WITH_ALT_ADDR3">DNC_AND_CAMPDNC_WITH_ALT_ADDR3</option>
				<option value="CAMPLISTS_ONLY_WITH_ALT_ADDR3">CAMPLISTS_ONLY_WITH_ALT_ADDR3</option>
				<option value="CAMPLISTS_ALL_WITH_ALT_ADDR3">CAMPLISTS_ALL_WITH_ALT_ADDR3</option>
				<option value="SYSTEM_WITH_ALT_ADDR3">SYSTEM_WITH_ALT_ADDR3</option>
				<option value="DNC_AND_CAMPLISTS_WITH_ALT_ADDR3">DNC_AND_CAMPLISTS_WITH_ALT_ADDR3</option>
				<option value="CAMPDNC_ONLY_AND_CAMPLISTS_WITH_ALT_ADDR3">CAMPDNC_ONLY_AND_CAMPLISTS_WITH_ALT_ADDR3</option>
				<option value="INTERNALDNC_ONLY_AND_CAMPLISTS_WITH_ALT_ADDR3">INTERNALDNC_ONLY_AND_CAMPLISTS_WITH_ALT_ADDR3</option>
				<option value="DNC_AND_CAMPDNC_AND_CAMPLISTS_WITH_ALT_ADDR3">DNC_AND_CAMPDNC_AND_CAMPLISTS_WITH_ALT_ADDR3</option>
				<option value="DNC_AND_CAMPLISTS_ALL_WITH_ALT_ADDR3">DNC_AND_CAMPLISTS_ALL_WITH_ALT_ADDR3</option>
				<option value="CAMPDNC_ONLY_AND_CAMPLISTS_ALL_WITH_ALT_ADDR3">CAMPDNC_ONLY_AND_CAMPLISTS_ALL_WITH_ALT_ADDR3</option>
				<option value="INTERNALDNC_ONLY_AND_CAMPLISTS_ALL_WITH_ALT_ADDR3">INTERNALDNC_ONLY_AND_CAMPLISTS_ALL_WITH_ALT_ADDR3</option>
				<option value="DNC_AND_CAMPDNC_AND_CAMPLISTS_ALL_WITH_ALT_ADDR3">DNC_AND_CAMPDNC_AND_CAMPLISTS_ALL_WITH_ALT_ADDR3</option>
				<option value="DNC_AND_SYSTEM_WITH_ALT_ADDR3">DNC_AND_SYSTEM_WITH_ALT_ADDR3</option>
				<option value="CAMPDNC_ONLY_AND_SYSTEM_WITH_ALT_ADDR3">CAMPDNC_ONLY_AND_SYSTEM_WITH_ALT_ADDR3</option>
				<option value="INTERNALDNC_ONLY_AND_SYSTEM_WITH_ALT_ADDR3">INTERNALDNC_ONLY_AND_SYSTEM_WITH_ALT_ADDR3</option>
				<option value="DNC_AND_CAMPDNC_AND_SYSTEM_WITH_ALT_ADDR3">DNC_AND_CAMPDNC_AND_SYSTEM_WITH_ALT_ADDR3</option>
				<option value="CALLBACK">CALLBACK</option>
				<option value="DNC_AND_CALLBACK">DNC_AND_CALLBACK</option>
				<option value="CAMPDNC_ONLY_AND_CALLBACK">CAMPDNC_ONLY_AND_CALLBACK</option>
				<option value="INTERNALDNC_ONLY_AND_CALLBACK">INTERNALDNC_ONLY_AND_CALLBACK</option>
				<option value="DNC_AND_CAMPDNC_AND_CALLBACK">DNC_AND_CAMPDNC_AND_CALLBACK</option>
				<option value="NONE_WITH_ALT_AND_CALLBACK">NONE_WITH_ALT_AND_CALLBACK</option>
				<option value="DNC_ONLY_WITH_ALT_AND_CALLBACK">DNC_ONLY_WITH_ALT_AND_CALLBACK</option>
				<option value="CAMPDNC_ONLY_WITH_ALT_AND_CALLBACK">CAMPDNC_ONLY_WITH_ALT_AND_CALLBACK</option>
				<option value="INTERNALDNC_ONLY_WITH_ALT_AND_CALLBACK">INTERNALDNC_ONLY_WITH_ALT_AND_CALLBACK</option>
				<option value="DNC_AND_CAMPDNC_WITH_ALT_AND_CALLBACK">DNC_AND_CAMPDNC_WITH_ALT_AND_CALLBACK</option>
				<option value="NONE_WITH_ALT_ADDR3_AND_CALLBACK">NONE_WITH_ALT_ADDR3_AND_CALLBACK</option>
				<option value="DNC_ONLY_WITH_ALT_ADDR3_AND_CALLBACK">DNC_ONLY_WITH_ALT_ADDR3_AND_CALLBACK</option>
				<option value="CAMPDNC_ONLY_WITH_ALT_ADDR3_AND_CALLBACK">CAMPDNC_ONLY_WITH_ALT_ADDR3_AND_CALLBACK</option>
				<option value="INTERNALDNC_ONLY_WITH_ALT_ADDR3_AND_CALLBACK">INTERNALDNC_ONLY_WITH_ALT_ADDR3_AND_CALLBACK</option>
				<option value="DNC_AND_CAMPDNC_WITH_ALT_ADDR3_AND_CALLBACK">DNC_AND_CAMPDNC_WITH_ALT_ADDR3_AND_CALLBACK</option>
				
              </select>
            </label>
            <label>
              Agent Recording:
              <input type="number" bind:value={user.agentRecording} placeholder="Enter value" />
            </label>
            <label>
              Agent Transfers:
              <input type="number" bind:value={user.agentTransfers} placeholder="Enter value" />
            </label>
          </div>
      
          <!-- Colonne 2 -->
          <div style="flex: 1;">
            <label>
              Closer Default Blended:
              <input type="number" bind:value={user.closerDefaultBlended} placeholder="Enter value" />
            </label>
            <label>
              Agent Recording Override:
              <select bind:value={user.agentRecordingOverride}>
                <option value="disabled">DISABLED</option>
                <option value="NEVER">NEVER</option>
                <option value="ONDEMAND">ONDEMAND</option>
                <option value="ALLCALLS">ALL CALLS</option>
                <option value="ALLFORCE">ALL FORCE</option>
              </select>
            </label>
            <label>
              Agent Alter Customer Data Override:
              <select bind:value={user.agentAlterCustomerDataOverride}>
                <option value="notactive">NOT_ACTIVE</option>
                <option value="ALLOWALTER">ALL_ALTER</option>
              </select>
            </label>
            <label>
              Agent Alter Customer Phone Override:
              <select bind:value={user.agentAlterCustomerPhoneOverride}>
                <option value="notactive">NOT_ACTIVE</option>
                <option value="ALLOWALTER">ALL_ALTER</option>
              </select>
            </label>
            <label>
              Agent Shift Enforcement Override:
              <select bind:value={user.agentShiftEnforcementOverride}>
                <option value="disabled">DISABLED</option>
                <option value="off">OFF</option>
                <option value="start">START</option>
                <option value="ALL">ALL</option>
              </select>
            </label>
            <label>
              Agent Call Log View Override:
              <select bind:value={user.agentCallLogViewOverride}>
                <option value="disabled">DISABLED</option>
                <option value="Y">Y</option>
                <option value="N">N</option>
              </select>
            </label>
            <label>
              Campaign Hide Call Log Override:
              <select bind:value={user.campaignHideCallLogOverride}>
                <option value="disabled">DISABLED</option>
                <option value="Y">Y</option>
                <option value="N">N</option>
              </select>
            </label>
            <label>
              Agent Lead Search Override:
              <select bind:value={user.agentLeadSearchOverride}>
                <option value="disabled">DISABLED</option>
                <option value="enabled">ENABLED</option>
                <option value="livecallinbound">LIVE_CALL_INBOUND</option>
                <option value="livecallinbound">LIVE_CALL_INBOUND_AND_MANUAL</option>
                <option value="NOTACTIVE">NOT_ACTIVE</option>
              </select>
            </label>
            <label>
              Lead Filter:
              <select bind:value={user.leadFilter}>
                <option value="none">NONE</option>
                <option value="DROP">DROP 72 HOUR-UK 72 DROP NO CALL</option>
              </select>
            </label>
            <label>
              Alert Enabled:
              <input type="number" bind:value={user.alertEnabled} placeholder="Enter value" />
            </label>
            <label>
              Allow Alerts:
              <input type="number" bind:value={user.allowAlerts} placeholder="Enter value" />
            </label>
            <label>
              Preset Contact Search:
              <select bind:value={user.PresetContactSearch}>
                <option value="disabled">DISABLED</option>
                <option value="NOTACTIVE">NOT_ACTIVE</option>
              </select>
            </label>
          </div>
        </div>
        <button type="submit">Update User</button>
    </div>

</form>