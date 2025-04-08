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

<div class="main-container">
    <div class="header">
        <h1>Create Campaign</h1>
        <div class="steps-indicator">
            {#each steps as step}
                <div class="step {currentStep === step.number ? 'active' : ''} {currentStep > step.number ? 'completed' : ''}">
                    <span class="step-number">{step.number}</span>
                    <span class="step-title">{step.title}</span>
                </div>
            {/each}
        </div>
    </div>

    <div class="content">
        <div class="sidebar">
            <div class="sidebar-header">
                <h2>Steps</h2>
            </div>
            <ul class="sidebar-menu">
                {#each steps as step}
                    <li class="sidebar-item {currentStep === step.number ? 'active' : ''}">
                        <button on:click={() => currentStep = step.number}>
                            <i class="bi bi-{step.icon}"></i>
                            <span>{step.title}</span>
                            {#if currentStep > step.number}
                                <i class="bi bi-check-circle status-icon"></i>
                            {/if}
                        </button>
                    </li>
                {/each}
            </ul>
            <div class="sidebar-footer">
                <a href="/compagnes/show" class="cancel-button">Cancel</a>
            </div>
        </div>

        <div class="form-container">
            {#if errorMessage}
                <div class="alert error">
                    <i class="bi bi-exclamation-triangle"></i>
                    <span>{errorMessage}</span>
                    <button class="close-button" on:click={() => errorMessage = ''}>×</button>
                </div>
            {/if}

            {#if successMessage}
                <div class="alert success">
                    <i class="bi bi-check-circle"></i>
                    <span>{successMessage}</span>
                    <button class="close-button" on:click={() => successMessage = ''}>×</button>
                </div>
            {/if}

            <div class="form-header">
                <h3>{steps[currentStep - 1].title}</h3>
            </div>

            <div class="form-body">
                {#if currentStep === steps.length}
                    <div class="review-container">
                        <h4>Review your campaign information</h4>
                        <table class="review-table">
                            <tbody>
                                {#each Object.entries(formData) as [key, value]}
                                    <tr>
                                        <th>{key.replace(/_/g, ' ')}</th>
                                        <td>{value || 'N/A'}</td>
                                    </tr>
                                {/each}
                            </tbody>
                        </table>
                    </div>
                {:else}
                    <div class="form-fields">
                        {#each steps[currentStep - 1].fields as field}
                            <div class="form-field">
                                <label for="{field.name}">
                                    {field.label} {field.required ? '*' : ''}
                                </label>
                                
                                {#if field.type === 'select'}
                                    <select 
                                        id="{field.name}" 
                                        class={formErrors[field.name] ? 'error' : ''}
                                        bind:value={formData[field.name]}
                                    >
                                        {#each field.options as option}
                                            <option value={option.value}>{option.label}</option>
                                        {/each}
                                    </select>
                                {:else if field.type === 'textarea'}
                                    <textarea 
                                        id="{field.name}" 
                                        class={formErrors[field.name] ? 'error' : ''}
                                        bind:value={formData[field.name]} 
                                        rows="4"
                                    ></textarea>
                                {:else if field.type === 'number'}
                                    <input 
                                        type="number" 
                                        id="{field.name}" 
                                        class={formErrors[field.name] ? 'error' : ''}
                                        bind:value={formData[field.name]} 
                                    />
                                {:else if field.type === 'url'}
                                    <input 
                                        type="url" 
                                        id="{field.name}" 
                                        class={formErrors[field.name] ? 'error' : ''}
                                        bind:value={formData[field.name]} 
                                    />
                                {:else}
                                    <input 
                                        type="text" 
                                        id="{field.name}" 
                                        class={formErrors[field.name] ? 'error' : ''}
                                        bind:value={formData[field.name]} 
                                    />
                                {/if}
                                
                                {#if formErrors[field.name]}
                                    <div class="error-message">{formErrors[field.name]}</div>
                                {/if}
                            </div>
                        {/each}
                    </div>
                {/if}
            </div>

            <div class="form-footer">
                {#if currentStep > 1}
                    <button type="button" class="btn btn-secondary" on:click={prevStep}>
                        Previous
                    </button>
                {/if}
                
                {#if currentStep < steps.length}
                    <button type="button" class="btn btn-primary" on:click={nextStep}>
                        Next
                    </button>
                {:else}
                    <button type="button" class="btn btn-success" on:click={submitForm} disabled={isSubmitting}>
                        {isSubmitting ? 'Submitting...' : 'Create Campaign'}
                    </button>
                {/if}
            </div>
        </div>
    </div>
</div>

<style>
    /* Simple, straightforward styling */
    .main-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
        font-family: Arial, sans-serif;
    }

    .header {
        margin-bottom: 20px;
        text-align: center;
    }

    .header h1 {
        margin-bottom: 20px;
        color: #333;
    }

    .steps-indicator {
        display: flex;
        justify-content: center;
        margin-bottom: 30px;
    }

    .step {
        display: flex;
        align-items: center;
        margin: 0 10px;
        color: #777;
    }

    .step.active {
        color: #007bff;
        font-weight: bold;
    }

    .step.completed {
        color: #28a745;
    }

    .step-number {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        background-color: #eee;
        margin-right: 10px;
        font-weight: bold;
    }

    .step.active .step-number {
        background-color: #007bff;
        color: white;
    }

    .step.completed .step-number {
        background-color: #28a745;
        color: white;
    }

    .content {
        display: flex;
        border: 1px solid #ddd;
        border-radius: 5px;
        overflow: hidden;
    }

    .sidebar {
        width: 250px;
        background-color: #f8f9fa;
        border-right: 1px solid #ddd;
        display: flex;
        flex-direction: column;
    }

    .sidebar-header {
        padding: 15px;
        border-bottom: 1px solid #ddd;
    }

    .sidebar-header h2 {
        margin: 0;
        font-size: 18px;
        color: #333;
    }

    .sidebar-menu {
        list-style: none;
        padding: 0;
        margin: 0;
        flex-grow: 1;
    }

    .sidebar-item {
        border-bottom: 1px solid #eee;
    }

    .sidebar-item button {
        display: flex;
        align-items: center;
        width: 100%;
        padding: 15px;
        text-align: left;
        background: none;
        border: none;
        cursor: pointer;
        color: #555;
    }

    .sidebar-item.active button {
        background-color: #e9ecef;
        color: #007bff;
        font-weight: bold;
    }

    .sidebar-item button i {
        margin-right: 10px;
        font-size: 16px;
    }

    .status-icon {
        margin-left: auto;
        color: #28a745;
    }

    .sidebar-footer {
        padding: 15px;
        border-top: 1px solid #ddd;
    }

    .cancel-button {
        display: block;
        text-align: center;
        padding: 8px 0;
        background-color: #f8f9fa;
        border: 1px solid #ddd;
        border-radius: 4px;
        color: #555;
        text-decoration: none;
    }

    .cancel-button:hover {
        background-color: #e9ecef;
    }

    .form-container {
        flex-grow: 1;
        padding: 20px;
        background-color: white;
    }

    .alert {
        padding: 12px 15px;
        margin-bottom: 20px;
        border-radius: 4px;
        display: flex;
        align-items: center;
    }

    .alert i {
        margin-right: 10px;
    }

    .alert.error {
        background-color: #f8d7da;
        color: #721c24;
        border: 1px solid #f5c6cb;
    }

    .alert.success {
        background-color: #d4edda;
        color: #155724;
        border: 1px solid #c3e6cb;
    }

    .close-button {
        margin-left: auto;
        background: none;
        border: none;
        font-size: 20px;
        cursor: pointer;
        color: inherit;
    }

    .form-header {
        margin-bottom: 20px;
        padding-bottom: 10px;
        border-bottom: 1px solid #eee;
    }

    .form-header h3 {
        margin: 0;
        color: #333;
    }

    .form-body {
        margin-bottom: 20px;
    }

    .form-fields {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 20px;
    }

    .form-field {
        margin-bottom: 15px;
    }

    .form-field label {
        display: block;
        margin-bottom: 5px;
        font-weight: bold;
        color: #555;
    }

    .form-field input,
    .form-field select,
    .form-field textarea {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 14px;
    }

    .form-field input:focus,
    .form-field select:focus,
    .form-field textarea:focus {
        outline: none;
        border-color: #80bdff;
        box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
    }

    .form-field input.error,
    .form-field select.error,
    .form-field textarea.error {
        border-color: #dc3545;
    }

    .error-message {
        color: #dc3545;
        font-size: 12px;
        margin-top: 5px;
    }

    .form-footer {
        display: flex;
        justify-content: space-between;
        padding-top: 20px;
        border-top: 1px solid #eee;
    }

    .btn {
        padding: 8px 16px;
        border-radius: 4px;
        font-weight: bold;
        cursor: pointer;
        border: none;
    }

    .btn-secondary {
        background-color: #6c757d;
        color: white;
    }

    .btn-primary {
        background-color: #007bff;
        color: white;
        margin-left: auto;
    }

    .btn-success {
        background-color: #28a745;
        color: white;
        margin-left: auto;
    }

    .btn:disabled {
        opacity: 0.65;
        cursor: not-allowed;
    }

    .review-container {
        padding: 20px;
        background-color: #f8f9fa;
        border-radius: 4px;
    }

    .review-container h4 {
        margin-top: 0;
        margin-bottom: 20px;
        color: #333;
    }

    .review-table {
        width: 100%;
        border-collapse: collapse;
    }

    .review-table th,
    .review-table td {
        padding: 10px;
        border-bottom: 1px solid #ddd;
        text-align: left;
    }

    .review-table th {
        width: 30%;
        color: #555;
        text-transform: capitalize;
    }

    @media (max-width: 768px) {
        .content {
            flex-direction: column;
        }

        .sidebar {
            width: 100%;
            border-right: none;
            border-bottom: 1px solid #ddd;
        }

        .form-fields {
            grid-template-columns: 1fr;
        }
    }
</style>