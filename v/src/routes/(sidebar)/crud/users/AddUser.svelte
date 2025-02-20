<script lang="ts">
    import { 
        Button, 
        Input, 
        Label, 
        Select, 
        Alert 
    } from 'flowbite-svelte';
    import axios from 'axios';

    // Form data
    let userData = {
        username: '',
        full_name: '',
        email: '',
        user_level: 1,
        status: 'active',
        phone_login: '',
        user_group: ''
    };

    // Validation and submission states
    let errors: Record<string, string> = {};
    let submitStatus: 'idle' | 'submitting' | 'success' | 'error' = 'idle';
    let submitMessage = '';

    // User levels and statuses
    const userLevels = [1, 2, 3, 4, 5];
    const userStatuses = [
        { value: 'active', name: 'Active' },
        { value: 'inactive', name: 'Inactive' },
        { value: 'suspended', name: 'Suspended' }
    ];

    // Validation function
    function validateForm() {
        errors = {};

        if (!userData.username) {
            errors.username = 'Username is required';
        }

        if (!userData.full_name) {
            errors.full_name = 'Full name is required';
        }

        if (userData.email && !/\S+@\S+\.\S+/.test(userData.email)) {
            errors.email = 'Invalid email format';
        }

        return Object.keys(errors).length === 0;
    }

    // Submit handler
    async function handleSubmit() {
        if (!validateForm()) return;

        submitStatus = 'submitting';
        submitMessage = '';

        try {
            const response = await axios.post('http://localhost:3000/api/admin/user/create', userData);
            
            submitStatus = 'success';
            submitMessage = 'User created successfully!';
            
            // Reset form
            userData = {
                username: '',
                full_name: '',
                email: '',
                user_level: 1,
                status: 'active',
                phone_login: '',
                user_group: ''
            };
        } catch (error) {
            submitStatus = 'error';
            submitMessage = 'Failed to create user. Please try again.';
            console.error(error);
        }
    }
</script>

<div class="space-y-6">
    <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Add New User</h2>

    {#if submitMessage}
        <Alert 
            color={submitStatus === 'success' ? 'green' : 'red'} 
            dismissable
        >
            {submitMessage}
        </Alert>
    {/if}

    <form on:submit|preventDefault={handleSubmit} class="space-y-4">
        <div>
            <Label for="username" class="mb-2">Username *</Label>
            <Input 
                id="username" 
                type="text" 
                bind:value={userData.username} 
                placeholder="Enter username"
                color={errors.username ? 'red' : 'base'}
            />
            {#if errors.username}
                <p class="mt-1 text-sm text-red-600 dark:text-red-500">{errors.username}</p>
            {/if}
        </div>

        <div>
            <Label for="full_name" class="mb-2">Full Name *</Label>
            <Input 
                id="full_name" 
                type="text" 
                bind:value={userData.full_name} 
                placeholder="Enter full name"
                color={errors.full_name ? 'red' : 'base'}
            />
            {#if errors.full_name}
                <p class="mt-1 text-sm text-red-600 dark:text-red-500">{errors.full_name}</p>
            {/if}
        </div>

        <div>
            <Label for="email" class="mb-2">Email</Label>
            <Input 
                id="email" 
                type="email" 
                bind:value={userData.email} 
                placeholder="Enter email (optional)"
                color={errors.email ? 'red' : 'base'}
            />
            {#if errors.email}
                <p class="mt-1 text-sm text-red-600 dark:text-red-500">{errors.email}</p>
            {/if}
        </div>

        <div>
            <Label for="phone_login" class="mb-2">Phone Login</Label>
            <Input 
                id="phone_login" 
                type="tel" 
                bind:value={userData.phone_login} 
                placeholder="Enter phone login (optional)"
            />
        </div>

        <div>
            <Label for="user_level" class="mb-2">User Level</Label>
            <Select 
                id="user_level"
                items={userLevels.map(level => ({ value: level, name: `Level ${level}` }))}
                bind:value={userData.user_level}
            />
        </div>

        <div>
            <Label for="status" class="mb-2">Status</Label>
            <Select 
                id="status"
                items={userStatuses}
                bind:value={userData.status}
            />
        </div>

        <div>
            <Label for="user_group" class="mb-2">User Group</Label>
            <Input 
                id="user_group" 
                type="text" 
                bind:value={userData.user_group} 
                placeholder="Enter user group (optional)"
            />
        </div>

        <div class="pt-4">
            <Button 
                type="submit" 
                color="primary" 
                disabled={submitStatus === 'submitting'}
            >
                {submitStatus === 'submitting' ? 'Creating...' : 'Create User'}
            </Button>
        </div>
    </form>
</div>
