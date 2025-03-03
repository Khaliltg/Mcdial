<script>
    // @ts-nocheck
    import { goto } from '$app/navigation';
    import { fade } from 'svelte/transition';

    let currentStep = 1;
    let isSubmitting = false;
    let errorMessage = '';
    let successMessage = '';
    let formErrors = {};

    let formData = {
        campaign_id: '',
        campaign_name: '',
        campaign_description: null,
        active: 'Y',
        park_ext: null,
        park_file_name: null,
        web_form_address: null,
        allow_closers: 'N',
        hopper_level: '1',
        auto_dial_level: '1',
        next_agent_call: 'QUEUE',
        local_call_time: '9am-5pm',
        voicemail_ext: null,
        campaign_script: null,
        get_call_launch: 'NONE'
    };

    const steps = [
        { 
            number: 1, 
            title: 'Basic Information', 
            icon: 'info-circle',
            fields: [
                { name: 'campaign_id', label: 'Campaign ID', required: true, type: 'text' },
                { name: 'campaign_name', label: 'Campaign Name', required: true, type: 'text' },
                { name: 'campaign_description', label: 'Campaign Description', required: false, type: 'textarea' }
            ]
        },
        { 
            number: 2, 
            title: 'Campaign Settings', 
            icon: 'gear',
            fields: [
                { name: 'active', label: 'Campaign Status', type: 'select', options: [
                    { value: 'Y', label: 'Active' },
                    { value: 'N', label: 'Inactive' }
                ]},
                { name: 'hopper_level', label: 'Hopper Level', type: 'number' },
                { name: 'auto_dial_level', label: 'Auto Dial Level', type: 'number' },
                { name: 'next_agent_call', label: 'Next Agent Call', type: 'select', options: [
                    { value: 'QUEUE', label: 'Queue' },
                    { value: 'ROUND_ROBIN', label: 'Round Robin' }
                ]}
            ]
        },
        { 
            number: 3, 
            title: 'Additional Details', 
            icon: 'list-task',
            fields: [
                { name: 'web_form_address', label: 'Web Form Address', type: 'url' },
                { name: 'local_call_time', label: 'Local Call Time', type: 'text' },
                { name: 'park_ext', label: 'Park Extension', type: 'text' },
                { name: 'voicemail_ext', label: 'Voicemail Extension', type: 'text' }
            ]
        },
        { 
            number: 4, 
            title: 'Review & Submit', 
            icon: 'check-circle',
            fields: []
        }
    ];

    function validateStep(stepNumber) {
        const step = steps.find(s => s.number === stepNumber);
        formErrors = {};

        step.fields.forEach(field => {
            const value = formData[field.name];
            
            if (field.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
                formErrors[field.name] = `${field.label} is required`;
            }
        });

        return Object.keys(formErrors).length === 0;
    }

    function prepareFormData() {
        const cleanedData = { ...formData };

        // Ensure all optional fields are null if empty
        const optionalFields = [
            'campaign_description', 
            'web_form_address', 
            'park_ext', 
            'voicemail_ext', 
            'campaign_script',
            'park_file_name'
        ];

        optionalFields.forEach(field => {
            if (cleanedData[field] === '') {
                cleanedData[field] = null;
            }
        });

        // Ensure required fields are not empty
        const requiredFields = ['campaign_id', 'campaign_name', 'active'];
        requiredFields.forEach(field => {
            if (!cleanedData[field] || cleanedData[field].trim() === '') {
                throw new Error(`${field} cannot be empty`);
            }
        });

        return cleanedData;
    }

    async function submitForm() {
        // Validate all previous steps
        for (let i = 1; i < steps.length; i++) {
            currentStep = i;
            if (!validateStep(i)) {
                return;
            }
        }

        isSubmitting = true;
        errorMessage = '';
        successMessage = '';

        try {
            // Prepare and clean form data
            const cleanedFormData = prepareFormData();

            const response = await fetch('http://localhost:8000/api/admin/compagnies/ajouter', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(cleanedFormData)
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Campaign creation failed');
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
</script>

<div class="container-fluid">
    <div class="row min-vh-100">
        <!-- Sidebar Navigation -->
        <div class="col-md-3 col-lg-2 bg-light border-end p-0">
            <div class="d-flex flex-column h-100">
                <div class="p-4 bg-primary text-white">
                    <h3 class="mb-0">Create Campaign</h3>
                </div>
                <nav class="nav flex-column p-3">
                    {#each steps as step}
                        <a 
                            href="javascript:void(0)" 
                            class="nav-link py-3 {
                                currentStep === step.number 
                                    ? 'active bg-primary text-white' 
                                    : currentStep > step.number 
                                    ? 'text-success' 
                                    : 'text-muted'
                            }"
                            on:click={() => currentStep = step.number}
                        >
                            <i class="bi bi-{step.icon} me-2"></i>
                            {step.title}
                            {#if currentStep > step.number}
                                <i class="bi bi-check-circle float-end"></i>
                            {/if}
                        </a>
                    {/each}
                </nav>
            </div>
        </div>

        <!-- Main Content -->
        <div class="col-md-9 col-lg-10 d-flex align-items-center">
            <div class="container">
                <form class="card shadow-sm" novalidate>
                    <div class="card-header bg-light">
                        <h4 class="mb-0">{steps[currentStep - 1].title}</h4>
                    </div>
                    
                    <div class="card-body">
                        {#if errorMessage}
                            <div class="alert alert-danger alert-dismissible fade show" role="alert">
                                {errorMessage}
                                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close" on:click={() => errorMessage = ''}></button>
                            </div>
                        {/if}

                        {#if successMessage}
                            <div class="alert alert-success alert-dismissible fade show" role="alert">
                                {successMessage}
                                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close" on:click={() => successMessage = ''}></button>
                            </div>
                        {/if}

                        {#if currentStep === steps.length}
                            <div transition:fade class="card">
                                <div class="card-header bg-light">
                                    <h5 class="mb-0">Campaign Summary</h5>
                                </div>
                                <div class="card-body">
                                    <ul class="list-group list-group-flush">
                                        {#each Object.entries(formData) as [key, value]}
                                            <li class="list-group-item">
                                                <strong>{key.replace(/_/g, ' ')}:</strong> {value || 'N/A'}
                                            </li>
                                        {/each}
                                    </ul>
                                </div>
                            </div>
                        {:else}
                            <div transition:fade class="row g-3">
                                {#each steps[currentStep - 1].fields as field}
                                    <div class="col-{field.name === 'campaign_description' ? '12' : 'md-6'}">
                                        <label for="{field.name}" class="form-label">
                                            {field.label} {field.required ? '*' : ''}
                                        </label>
                                        
                                        {#if field.type === 'select'}
                                            <select 
                                                class="form-select {formErrors[field.name] ? 'is-invalid' : ''}" 
                                                id="{field.name}" 
                                                bind:value={formData[field.name]}
                                            >
                                                {#each field.options as option}
                                                    <option value={option.value}>{option.label}</option>
                                                {/each}
                                            </select>
                                        {:else if field.type === 'textarea'}
                                            <textarea 
                                                class="form-control {formErrors[field.name] ? 'is-invalid' : ''}" 
                                                id="{field.name}" 
                                                bind:value={formData[field.name]} 
                                                rows="3"
                                                placeholder="Provide a brief description"
                                            ></textarea>
                                        {:else if field.type === 'number'}
                                            <input 
                                                type="number" 
                                                class="form-control {formErrors[field.name] ? 'is-invalid' : ''}" 
                                                id="{field.name}" 
                                                bind:value={formData[field.name]} 
                                                placeholder="{field.label}"
                                            />
                                        {:else if field.type === 'url'}
                                            <input 
                                                type="url" 
                                                class="form-control {formErrors[field.name] ? 'is-invalid' : ''}" 
                                                id="{field.name}" 
                                                bind:value={formData[field.name]} 
                                                placeholder="{field.label}"
                                            />
                                        {:else}
                                            <input 
                                                type="text" 
                                                class="form-control {formErrors[field.name] ? 'is-invalid' : ''}" 
                                                id="{field.name}" 
                                                bind:value={formData[field.name]} 
                                                placeholder="{field.label}"
                                            />
                                        {/if}
                                        
                                        {#if formErrors[field.name]}
                                            <div class="invalid-feedback">
                                                {formErrors[field.name]}
                                            </div>
                                        {/if}
                                    </div>
                                {/each}
                            </div>
                        {/if}
                    </div>

                    <div class="card-footer bg-light">
                        <div class="d-flex justify-content-between">
                            {#if currentStep > 1}
                                <button 
                                    type="button" 
                                    class="btn btn-secondary" 
                                    on:click={prevStep}
                                >
                                    Previous
                                </button>
                            {/if}
                            
                            {#if currentStep < steps.length}
                                <button 
                                    type="button" 
                                    class="btn btn-primary ms-auto" 
                                    on:click={nextStep}
                                >
                                    Next
                                </button>
                            {/if}

                            {#if currentStep === steps.length}
                                <button 
                                    type="button" 
                                    class="btn btn-success" 
                                    on:click={submitForm}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Submitting...' : 'Create Campaign'}
                                </button>
                            {/if}
                        </div>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>

<style>
    .nav-link {
        border-radius: 0.25rem;
        margin-bottom: 0.5rem;
        transition: all 0.3s ease;
    }

    .nav-link:hover {
        background-color: rgba(0,0,0,0.05);
    }
</style>