<script>
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";

    // Initialize the user object with default values
    let user = {
        access_recordings: "0",
        active: "Y",
        add_timeclock_log: "0",
        admin_cf_show_hidden: "0",
        admin_hide_lead_data: "0",
        admin_hide_phone_data: "0",
        agent_call_log_view_override: "DISABLED",
        agent_choose_blended: "1",
        agent_choose_ingroups: "1",
        agent_choose_territories: "1",
        agent_lead_search_override: "NOT_ACTIVE",
        agent_shift_enforcement_override: "DISABLED",
        agentcall_chat: "0",
        agentcall_email: "0",
        agentcall_manual: "0",
        agentonly_callbacks: "0",
        alert_enabled: "0",
        allow_alerts: "0",
        alter_admin_interface_options: "1",
        alter_agent_interface_options: "0",
        alter_custdata_override: "NOT_ACTIVE",
        alter_custphone_override: "NOT_ACTIVE",
        api_allowed_functions: "ALL_FUNCTIONS",
        api_list_restrict: "0",
        api_only_user: "0",
        ast_admin_access: "0",
        ast_delete_phones: "0",
        callcard_admin: "0",
        campaign_detail: "0",
        change_agent_campaign: "0",
        closer_campaigns: null,
        closer_default_blended: "0",
        custom_fields_modify: "0",
        custom_five: "",
        custom_four: "",
        custom_one: "",
        custom_three: "",
        custom_two: "",
        delete_call_times: "0",
        delete_campaigns: "0",
        delete_filters: "0",
        delete_from_dnc: "0",
        delete_inbound_dids: "0",
        delete_ingroups: "0",
        delete_lists: "0",
        delete_remote_agents: "0",
        delete_scripts: "0",
        delete_timeclock_log: "0",
        delete_user_groups: "0",
        delete_users: "0",
        download_invalid_files: "0",
        download_lists: "0",
        email: "",
        export_gdpr_leads: "0",
        export_reports: "0",
        failed_last_ip_today: "",
        failed_last_type_today: "",
        failed_login_attempts_today: 0,
        failed_login_count: 0,
        failed_login_count_today: 0,
        force_change_password: "N",
        full_name: "khalil",
        hci_enabled: "0",
        hide_call_log_info: "DISABLED",
        hotkeys_active: "0",
        ignore_group_on_search: "0",
        ignore_ip_list: "0",
        inbound_credits: -1,
        last_ip: "",
        last_login_date: "2000-12-31T23:00:01.000Z",
        lead_filter_id: "NONE",
        load_leads: "0",
        manager_shift_enforcement_override: "0",
        manual_dial_filter: "DISABLED",
        max_hopper_calls: 0,
        max_hopper_calls_hour: 0,
        max_inbound_calls: 0,
        max_inbound_filter_enabled: "0",
        max_inbound_filter_ingroups: null,
        max_inbound_filter_min_sec: -1,
        max_inbound_filter_statuses: null,
        mobile_number: "",
        modify_audiostore: "0",
        modify_auto_reports: "0",
        modify_call_times: "0",
        modify_campaigns: "0",
        modify_carriers: "0",
        modify_colors: "0",
        modify_contacts: "0",
        modify_custom_dialplans: "0",
        modify_dial_prefix: "0",
        modify_email_accounts: "0",
        modify_filters: "0",
        modify_inbound_dids: "0",
        modify_ingroups: "0",
        modify_ip_lists: "0",
        modify_labels: "0",
        modify_languages: "0",
        modify_leads: "0",
        modify_lists: "0",
        modify_moh: "0",
        modify_phones: "0",
        modify_remoteagents: "0",
        modify_same_user_level: "1",
        modify_scripts: "0",
        modify_servers: "0",
        modify_shifts: "0",
        modify_stamp: "2025-02-25T15:46:15.000Z",
        modify_statuses: "0",
        modify_timeclock_log: "0",
        modify_tts: "0",
        modify_usergroups: "0",
        modify_users: "0",
        modify_voicemail: "0",
        mute_recordings: "DISABLED",
        next_dial_my_callbacks: "NOT_ACTIVE",
        pass: "",
        pass_hash: "",
        pause_code_approval: "0",
        phone_login: null,
        phone_pass: null,
        preset_contact_search: "NOT_ACTIVE",
        qc_commit: "0",
        qc_enabled: "0",
        qc_finish: "0",
        qc_pass: "0",
        qc_user_level: 1,
        ready_max_logout: -1,
        realtime_block_user_info: "0",
        scheduled_callbacks: "1",
        selected_language: "default English",
        shift_override_flag: "0",
        status_group_id: "",
        territory: "",
        two_factor_override: "NOT_ACTIVE",
        user: "",
        user_admin_redirect_url: null,
        user_choose_language: "0",
        user_code: "",
        user_group: "test",
        user_group_two: "",
        user_hide_realtime: "0",
        user_id: 10,
        user_level: 8,
        user_location: "",
        user_new_lead_limit: -1,
        user_nickname: "",
        vdc_agent_api_access: "0",
        vicidial_recording: "1",
        vicidial_recording_override: "DISABLED",
        vicidial_transfers: "1",
        view_reports: "0",
        voicemail_id: null,
        wrapup_seconds_override: -1,
    };

    let userId = null;

    // Fetch user details based on the userId
    async function fetchUserDetails(id) {
        try {
            const response = await fetch(
                `http://localhost:8000/api/admin/user/getUserById/${id}`,
            );
            if (response.ok) {
                const data = await response.json();
                console.log(data[0]);

                if (data.length > 0) {
                    user = { ...user, ...data[0] }; // Merge fetched data into user object
                }
            } else {
                console.error("Failed to fetch user details");
            }
        } catch (error) {
            console.error("Error fetching user details:", error);
        }
    }

    // Update user
    async function updateUser(event) {
        event.preventDefault(); // Prevent default form submission

        console.log("Sending updated data:", user); // Log the data to ensure it is populated
        try {
            const response = await fetch(
                `http://localhost:8000/api/admin/user/users/${userId}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json", // Make sure Content-Type is correct
                    },
                    body: JSON.stringify(user), // Ensure data is correctly stringified
                },
            );

            if (!response.ok) {
                throw new Error("Failed to update user.");
            }

            const result = await response.json();
            console.log(result.message); // Log the response message
            alert("User updated successfully!");
        } catch (error) {
            console.error("Error updating user:", error);
            alert("Failed to update user. Please try again.");
        }
    }

    // Get userId from the URL query parameters
    onMount(() => {
        const urlParams = new URLSearchParams(window.location.search);
        userId = urlParams.get("id");

        if (!userId) {
            console.error("No user ID provided");
            goto("/users"); // Navigate back if no ID
        } else {
            fetchUserDetails(userId); // Fetch the user details using the id
        }
    });
</script>

<!-- Form for user update -->

<form on:submit={updateUser}>
    <div class="form-section">
        <h2>User Information</h2>
        <!-- User Information Form Fields -->
        <div style="display: flex; gap: 20px;">
            <!-- Column 1 -->
            <div style="flex: 1;">
                <label>
                    User :
                    <input
                        bind:value={user.user}
                        placeholder="Enter user number"
                    />
                </label>
                <label>
                    Password:
                    <input
                        type="text"
                        bind:value={user.pass}
                        placeholder="Enter password"
                    />
                </label>
                <label>
                    Force Change Password:
                    <select bind:value={user.force_change_password}>
                        <option value="Y">Yes</option>
                        <option value="N">No</option>
                    </select>
                </label>
                <label>
                    Phone Pass:
                    <input
                        bind:value={user.phone_pass}
                        placeholder="Enter phone password"
                    />
                </label>
                <label>
                    Phone Login:
                    <input
                        bind:value={user.phone_login}
                        placeholder="Enter phone login"
                    />
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
                    <input
                        type="number"
                        bind:value={user.user_level}
                        placeholder="Enter user level"
                    />
                </label>
             
            </div>
            <!-- Column 2 -->
            <div style="flex: 1;">
                <label>
                    Full Name:
                    <input
                        bind:value={user.full_name}
                        placeholder="Enter full name"
                    />
                </label>
                <label>
                    User Code:
                    <input
                        bind:value={user.user_code}
                        placeholder="Enter user code"
                    />
                </label>
                <label>
                    Email:
                    <input
                        type="email"
                        bind:value={user.email}
                        placeholder="Enter email"
                    />
                </label>
                <label>
                    Mobile Number:
                    <input
                        type="tel"
                        bind:value={user.mobile_number}
                        placeholder="Enter mobile number"
                    />
                </label>
                <label>
                    Agent-Only Callbacks:
                    <input
                        type="number"
                        bind:value={user.agentonly_callbacks}
                        placeholder="Enter value"
                    />
                </label>
                <label>
                    Agent Call Manual:
                    <input
                        type="number"
                        bind:value={user.agentcall_manual}
                        placeholder="Enter value"
                    />
                </label>
                <label>
                    User Group:
                    <input
                        bind:value={user.user_group}
                        placeholder="Enter user group"
                    />
                </label>
            </div>
        </div>
    </div>

    <div class="form-section">
        <!-- Submit Button -->
        <div class="form-section">
            <button type="submit" class="btn-primary">Update User</button>
        </div>
    </div>
</form>

<style>
    .user-form {
        max-width: 800px;
        margin: auto;
        padding: 20px;
        border: 1px solid #ccc;
        border-radius: 8px;
        background-color: #f9f9f9;
    }

    .form-section {
        margin-bottom: 20px;
    }

    h2 {
        margin-bottom: 10px;
        color: rgb(29, 29, 240);
        font-weight: bold;
    }

    .form-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 20px;
    }

    label {
        display: block;
        margin-bottom: 5px;
        font-weight: bold;
    }

    input,
    select {
        width: 100%;
        padding: 10px;
        margin-bottom: 12px;
        border: 1px solid #4a4df0;
        border-radius: 4px;
        transition: border-color 0.2s;
    }

    input:focus,
    select:focus {
        border-color: #085fbb;
    }

    button {
        background-color: #007bff;
        color: white;
        padding: 10px 20px;
        border: none;
        border-radius: 4px;
        font-size: 16px;
        cursor: pointer;
        transition: background-color 0.2s;
    }

    button:hover {
        background-color: #0056b3;
    }
</style>
