<script>
    import { goto } from '$app/navigation';
    import { fade } from 'svelte/transition';

    let currentStep = 1;
    let isSubmitting = false;
    let errorMessage = '';
    let successMessage = '';

    let formData = {
        // Basic Information
        campaign_id: '',
        campaign_name: '',
        campaign_description: '',

        // Advanced Settings
        active: 'Y',
        hopper_level: '1',
        auto_dial_level: '1',
        next_agent_call: 'QUEUE',

        // Additional Details
        web_form_address: '',
        local_call_time: '9am-5pm',
        park_ext: '',
        voicemail_ext: '',
        campaign_script: '',
        get_call_launch: 'NONE'
    };

    const steps = [
        {
            number: 1,
            title: 'Basic Information',
            fields: ['campaign_id', 'campaign_name', 'campaign_description']
        },
        {
            number: 2,
            title: 'Campaign Settings',
            fields: ['active', 'hopper_level', 'auto_dial_level', 'next_agent_call']
        },
        {
            number: 3,
            title: 'Additional Details',
            fields: ['web_form_address', 'local_call_time', 'park_ext', 'voicemail_ext']
        },
        {
            number: 4,
            title: 'Review & Submit',
            fields: []
        }
    ];

    function validateStep(stepNumber) {
        const step = steps.find(s => s.number === stepNumber);
        
        // Basic validation
        for (let field of step.fields) {
            if (stepNumber === 1 && (field === 'campaign_id' || field === 'campaign_name')) {
                if (!formData[field]) {
                    errorMessage = `Please fill in the ${field.replace('_', ' ')}`;
                    return false;
                }
            }
        }
        
        errorMessage = '';
        return true;
    }

    function nextStep() {
        if (validateStep(currentStep)) {
            if (currentStep < steps.length) {
                currentStep++;
            }
        }
    }

    function prevStep() {
        if (currentStep > 1) {
            currentStep--;
        }
    }

    async function submitForm() {
        isSubmitting = true;
        errorMessage = '';
        successMessage = '';

        // Final validation
        if (!formData.campaign_id || !formData.campaign_name) {
            errorMessage = 'Campaign ID and Name are required';
            isSubmitting = false;
            return;
        }

        try {
            const response = await fetch('http://localhost:8000/api/admin/compagnies/ajouter', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'An error occurred');
            }

            successMessage = 'Campaign added successfully';
            
            setTimeout(() => {
                goto('/compagnes/show');
            }, 2000);

        } catch (error) {
            errorMessage = error.message || 'An unexpected error occurred';
        } finally {
            isSubmitting = false;
        }
    }
</script>

<div class="container-fluid bg-light min-vh-100 d-flex align-items-center justify-content-center py-5">
    <div class="card shadow-lg w-100" style="max-width: 800px;">
        <!-- Wizard Header -->
        <div class="card-header bg-primary text-white">
            <h2 class="mb-0">Create New Campaign</h2>
            <nav aria-label="Campaign creation steps">
                <ol class="breadcrumb bg-primary text-white p-0 m-0">
                    {#each steps as step}
                        <li 
                            class="breadcrumb-item {currentStep === step.number ? 'active' : ''}"
                            class:text-light={currentStep === step.number}
                            class:text-white-50={currentStep !== step.number}
                        >
                            {step.title}
                        </li>
                    {/each}
                </ol>
            </nav>
        </div>

        <!-- Notifications -->
        {#if errorMessage}
            <div 
                transition:fade
                class="alert alert-danger m-3" 
                role="alert"
            >
                {errorMessage}
            </div>
        {/if}
        
        {#if successMessage}
            <div 
                transition:fade
                class="alert alert-success m-3" 
                role="alert"
            >
                {successMessage}
            </div>
        {/if}

        <!-- Wizard Form -->
        <form class="card-body">
            <!-- Step 1: Basic Information -->
            {#if currentStep === 1}
                <div transition:fade class="row g-3">
                    <div class="col-md-6">
                        <label for="campaign_id" class="form-label">Campaign ID *</label>
                        <input 
                            type="text" 
                            id="campaign_id" 
                            class="form-control" 
                            bind:value={formData.campaign_id} 
                            required 
                            placeholder="Enter unique campaign ID"
                        >
                    </div>
                    
                    <div class="col-md-6">
                        <label for="campaign_name" class="form-label">Campaign Name *</label>
                        <input 
                            type="text" 
                            id="campaign_name" 
                            class="form-control" 
                            bind:value={formData.campaign_name} 
                            required 
                            placeholder="Enter campaign name"
                        >
                    </div>

                    <div class="col-12">
                        <label for="campaign_description" class="form-label">Campaign Description</label>
                        <textarea 
                            id="campaign_description" 
                            class="form-control" 
                            bind:value={formData.campaign_description} 
                            rows="3"
                            placeholder="Provide a brief description of the campaign"
                        ></textarea>
                    </div>
                </div>
            {/if}

            <!-- Step 2: Campaign Settings -->
            {#if currentStep === 2}
                <div transition:fade class="row g-3">
                    <div class="col-md-6">
                        <label for="active" class="form-label">Campaign Status</label>
                        <select 
                            id="active" 
                            class="form-select" 
                            bind:value={formData.active}
                        >
                            <option value="Y">Active</option>
                            <option value="N">Inactive</option>
                        </select>
                    </div>

                    <div class="col-md-6">
                        <label for="next_agent_call" class="form-label">Next Agent Call</label>
                        <select 
                            id="next_agent_call" 
                            class="form-select" 
                            bind:value={formData.next_agent_call}
                        >
                            <option value="QUEUE">Queue</option>
                            <option value="RANDOM">Random</option>
                        </select>
                    </div>

                    <div class="col-md-6">
                        <label for="hopper_level" class="form-label">Hopper Level</label>
                        <input 
                            type="number" 
                            id="hopper_level" 
                            class="form-control" 
                            bind:value={formData.hopper_level}
                            min="1"
                        >
                    </div>

                    <div class="col-md-6">
                        <label for="auto_dial_level" class="form-label">Auto Dial Level</label>
                        <input 
                            type="number" 
                            id="auto_dial_level" 
                            class="form-control" 
                            bind:value={formData.auto_dial_level}
                            min="1"
                        >
                    </div>
                </div>
            {/if}

            <!-- Step 3: Additional Details -->
            {#if currentStep === 3}
                <div transition:fade class="row g-3">
                    <div class="col-md-6">
                        <label for="web_form_address" class="form-label">Web Form Address</label>
                        <input 
                            type="url" 
                            id="web_form_address" 
                            class="form-control" 
                            bind:value={formData.web_form_address}
                            placeholder="https://example.com/form"
                        >
                    </div>

                    <div class="col-md-6">
                        <label for="local_call_time" class="form-label">Local Call Time</label>
                        <input 
                            type="text" 
                            id="local_call_time" 
                            class="form-control" 
                            bind:value={formData.local_call_time}
                            placeholder="e.g. 9am-5pm"
                        >
                    </div>

                    <div class="col-md-6">
                        <label for="park_ext" class="form-label">Park Extension</label>
                        <input 
                            type="text" 
                            id="park_ext" 
                            class="form-control" 
                            bind:value={formData.park_ext}
                            placeholder="Enter park extension"
                        >
                    </div>

                    <div class="col-md-6">
                        <label for="voicemail_ext" class="form-label">Voicemail Extension</label>
                        <input 
                            type="text" 
                            id="voicemail_ext" 
                            class="form-control" 
                            bind:value={formData.voicemail_ext}
                            placeholder="Enter voicemail extension"
                        >
                    </div>
                </div>
            {/if}

            <!-- Step 4: Review & Submit -->
            {#if currentStep === 4}
                <div transition:fade class="row g-3">
                    <div class="col-12">
                        <h3>Review Campaign Details</h3>
                        <table class="table table-striped">
                            <tbody>
                                <tr>
                                    <th>Campaign ID</th>
                                    <td>{formData.campaign_id}</td>
                                </tr>
                                <tr>
                                    <th>Campaign Name</th>
                                    <td>{formData.campaign_name}</td>
                                </tr>
                                <tr>
                                    <th>Description</th>
                                    <td>{formData.campaign_description || 'N/A'}</td>
                                </tr>
                                <tr>
                                    <th>Status</th>
                                    <td>{formData.active === 'Y' ? 'Active' : 'Inactive'}</td>
                                </tr>
                                <tr>
                                    <th>Hopper Level</th>
                                    <td>{formData.hopper_level}</td>
                                </tr>
                                <tr>
                                    <th>Web Form Address</th>
                                    <td>{formData.web_form_address || 'N/A'}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            {/if}

            <!-- Navigation Buttons -->
            <div class="d-flex justify-content-between mt-4">
                {#if currentStep > 1 && currentStep < 4}
                    <button 
                        type="button" 
                        class="btn btn-secondary" 
                        on:click={prevStep}
                    >
                        Previous
                    </button>
                {/if}

                {#if currentStep < 4}
                    <button 
                        type="button" 
                        class="btn btn-primary ms-auto" 
                        on:click={nextStep}
                    >
                        Next
                    </button>
                {/if}

                {#if currentStep === 4}
                    <button 
                        type="button" 
                        class="btn btn-success" 
                        on:click={submitForm}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Submitting...' : 'Confirm & Submit'}
                    </button>
                {/if}
            </div>
        </form>
    </div>
</div>

<style>
    /* Any additional custom styles can be added here */
</style>