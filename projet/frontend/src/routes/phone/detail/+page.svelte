<script>
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { fetchWithAuth } from '$lib/utils/fetchWithAuth.js';
    
    // API configuration
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    
    // Get phone ID from URL
    import { page } from '$app/stores';
    let phoneId = $page.url.searchParams.get('id');
    
    // Phone data
    let phoneExtension = '';
    let dialPlanNumber ='';
    let outboundCallerID ='';
    let adminUserGroup ='';
    let phoneIpAdress ='';
    let agentScreenLogin = '';
    let loginPassword = '';
    let registrationPassword = '';
    let isLoading = false;
    let errorMessage = '';
    let successMessage = '';


    // Load phone data on component mount
    onMount(async () => {
        try {
            // Get phone details by extension
            const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/phone/${phoneId}`);
            const contentType = response.headers.get('content-type');
            
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Phone not found');
                }
                const errorData = contentType?.includes('application/json') 
                    ? await response.json()
                    : { message: 'Server error occurred' };
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }
            
            if (!contentType?.includes('application/json')) {
                throw new Error('Invalid response format from server');
            }

            const data = await response.json();
            phoneExtension = data.extension || '';
            
            agentScreenLogin = data.login || '';
            loginPassword = data.pass || '';
            registrationPassword = data.pass || '';
        } catch (error) {
            console.error('Error:', error);
            errorMessage = 'Error fetching phone details: ' + (error instanceof Error ? error.message : 'Unknown error occurred');
        }
    });

    async function handleSubmit() {
        isLoading = true;
        errorMessage = '';
        successMessage = '';
        
        try {
            // Update phone by current extension
            const response = await fetchWithAuth(`${API_BASE_URL}/api/admin/phone/${phoneExtension}`, {
                method: 'PUT',
                body: JSON.stringify({
                    login: agentScreenLogin,
                    pass: loginPassword
                })
            });
            
            const contentType = response.headers.get('content-type');
            
            if (!response.ok) {
                const errorData = contentType?.includes('application/json')
                    ? await response.json()
                    : { message: `Server error: ${response.status}` };
                throw new Error(errorData.message || 'Failed to update phone');
            }

            successMessage = 'Phone updated successfully!';
            // Redirect to list after delay
            setTimeout(() => {
                goto('/phone/afficher');
            }, 1500);
        } catch (error) {
            console.error('Error:', error);
            errorMessage = 'Error updating phone: ' + (error instanceof Error ? error.message : 'Unknown error occurred');
        } finally {
            isLoading = false;
        }
    }
</script>

<div class="login-container">
    <h2>Modify Phone</h2>
    
    {#if errorMessage}
        <div class="error-message">{errorMessage}</div>
    {/if}
    
    {#if successMessage}
        <div class="success-message">{successMessage}</div>
    {/if}
    
    <form on:submit|preventDefault={handleSubmit}>
        <div class="form-group">
            <label for="phoneExtension">Phone Extension:</label>
            <input 
                type="text" 
                id="phoneExtension" 
                value={phoneExtension}
                readonly
                disabled
                class="readonly"
                placeholder="Phone extension cannot be changed"
            />
        </div>

           
        <div class="form-group">
            <label for="dialPlanNumber">Dial Plan Number:</label>
            <input 
                type="text" 
                id="agentScreenLogin" 
                bind:value={agentScreenLogin}
                required
                placeholder="Enter agent screen login"
            />
        </div>
        
        <div class="form-group">
            <label for="agentScreenLogin">Agent Screen Login:</label>
            <input 
                type="text" 
                id="agentScreenLogin" 
                bind:value={agentScreenLogin}
                required
                placeholder="Enter agent screen login"
            />
        </div>

        <div class="form-group">
            <label for="loginPassword">Login Password:</label>
            <input 
                type="password" 
                id="loginPassword" 
                bind:value={loginPassword}
                required
                placeholder="Enter login password"
            />
        </div>

        <div class="form-group">
            <label for="registrationPassword">Registration Password:</label>
            <input 
                type="password" 
                id="registrationPassword" 
                bind:value={registrationPassword}
                required
                placeholder="Enter registration password"
            />
        </div>

        <button type="submit" disabled={isLoading}>
            {isLoading ? 'Updating...' : 'Update'}
        </button>
    </form>
</div>

<style>
    .login-container {
        max-width: 400px;
        margin: 50px auto;
        padding: 20px;
        background: white;
        border: 1px solid #ccc;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }

    h2 {
        text-align: center;
        margin-bottom: 20px;
        color: #333;
    }

    .form-group {
        margin-bottom: 15px;
    }

    label {
        display: block;
        margin-bottom: 5px;
        font-weight: bold;
        color: #555;
    }

    input {
        width: 100%;
        padding: 10px;
        box-sizing: border-box;
        border: 1px solid #ccc;
        border-radius: 4px;
        transition: border-color 0.3s;
    }

    input:focus {
        border-color: #4CAF50;
        outline: none;
    }

    .readonly {
        background-color: #f5f5f5;
        cursor: not-allowed;
        color: #666;
    }

    button {
        width: 100%;
        padding: 10px;
        background-color: #4CAF50;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 16px;
        transition: background-color 0.3s;
    }

    button:hover {
        background-color: #45a049;
    }

    button:disabled {
        background-color: #cccccc;
        cursor: not-allowed;
    }

    .error-message {
        color: #dc3545;
        padding: 10px;
        margin-bottom: 15px;
        border: 1px solid #dc3545;
        border-radius: 4px;
        background-color: #f8d7da;
    }

    .success-message {
        color: #28a745;
        padding: 10px;
        margin-bottom: 15px;
        border: 1px solid #28a745;
        border-radius: 4px;
        background-color: #d4edda;
    }

    @media (max-width: 400px) {
        .login-container {
            padding: 15px;
            margin: 20px;
        }
    }
</style>
