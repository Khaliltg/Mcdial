<script>
    let NewUserNumber = '';
    let password = '';
    let fullName = '';
    let sourceUser = '';
    let errorMessage = '';
    let data = []; 
  
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation'; // Adjust the path if needed

    const handleSubmit = async () => {
        if (!NewUserNumber || !password || !fullName || !sourceUser) {
            errorMessage = 'Please fill in all fields.';
            return;
        }
        if (password.length < 8) {
            errorMessage = 'Password must be at least 8 characters long.';
            return;
        }
        
        errorMessage = '';
        
        // Prepare data for the API request
        const userData = {
            user: NewUserNumber,
            pass: password,
            full_name: fullName,
            userID: sourceUser // Ensure this matches your backend expectations
        };

        console.log(userData); // Log the entire userData object

        try {
            const response = await fetch('http://localhost:8000/api/admin/user/copyUser', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                errorMessage = errorData.message || 'Failed to copy user.';
                return;
            }

            alert('User copied successfully!');
            // Optionally reset the form
            NewUserNumber = '';
            password = '';
            fullName = '';
            sourceUser = '';

            // Navigate to /users/list
            goto('/users/list');
        } catch (error) {
            errorMessage = 'An error occurred: ' + error.message;
        }
    };
  
    const getUser = async () => {
        const response = await fetch('http://localhost:8000/api/admin/user/allUsers');
        if (!response.ok) {
            errorMessage = 'Failed to fetch user data.';
            return;
        }
        const fetchedData = await response.json();
        data = fetchedData;  
        console.log(data);  
    };
  
    const getPasswordStrength = () => {
        if (password.length === 0) return 'None';
        if (password.length < 4) return 'Weak';
        if (password.length < 8) return 'Medium';
        return 'Strong';
    };
  
    onMount(() => {
        getUser(); 
    });
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
    .submit-btn {
        background-color: #291bf7;
        color: white;
        padding: 12px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 16px;
    }
    .submit-btn:hover {
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

<h2>𝐂𝐨𝐩𝐲 𝐔𝐬𝐞𝐫</h2>
<div class="container">
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
        <select bind:value={sourceUser}>
            <option value="" disabled>Select Source User</option>
            {#each data as user}
                <option value={user.user_id}>{user.full_name}</option>
            {/each}
        </select>
    </div>
    <button class="submit-btn" on:click={handleSubmit}>SUBMIT</button>
</div>