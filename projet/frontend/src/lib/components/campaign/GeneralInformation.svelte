<script>
    export let company = {};

    function formatDate(date) {
        if (!date) return '';
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
</script>

<div class="card border-0 rounded-4 bg-white">
    <div class="card-header bg-light border-0 py-3">
        <div class="d-flex align-items-center gap-2">
            <div class="bg-primary bg-opacity-10 p-2 rounded-3">
                <i class="bi bi-info-circle text-primary"></i>
            </div>
            <h5 class="mb-0 fw-semibold">General Information</h5>
        </div>
    </div>

    <div class="card-body p-4">
        <div class="row g-4">
            <div class="col-md-6">
                <div class="form-group">
                    <label for="campaign_id" class="form-label">Campaign ID</label>
                    <input 
                        type="text" 
                        id="campaign_id" 
                        class="form-control form-control-sm bg-light" 
                        value={company?.campaign_id || ''} 
                        readonly
                    />
                </div>
            </div>
            
            <div class="col-md-6">
                <div class="form-group">
                    <label for="campaign_name" class="form-label">Campaign Name</label>
                    <input 
                        type="text" 
                        id="campaign_name" 
                        class="form-control form-control-sm" 
                        bind:value={company.campaign_name}
                        placeholder="Enter campaign name"
                    />
                </div>
            </div>
            
            <div class="col-12">
                <div class="form-group">
                    <label for="campaign_description" class="form-label">Description</label>
                    <textarea 
                        id="campaign_description" 
                        class="form-control form-control-sm" 
                        bind:value={company.campaign_description}
                        placeholder="Enter campaign description"
                        rows="3"
                    ></textarea>
                </div>
            </div>

            <div class="col-md-6">
                <div class="form-group">
                    <label for="campaign_changedate" class="form-label d-flex align-items-center gap-2">
                        <i class="bi bi-calendar text-muted"></i>
                        Change Date
                    </label>
                    <input 
                        type="text" 
                        id="campaign_changedate" 
                        class="form-control form-control-sm bg-light" 
                        value={formatDate(company?.campaign_changedate)} 
                        readonly
                    />
                </div>
            </div>
            
            <div class="col-md-6">
                <div class="form-group">
                    <label for="campaign_logindate" class="form-label d-flex align-items-center gap-2">
                        <i class="bi bi-clock text-muted"></i>
                        Login Date
                    </label>
                    <input 
                        type="text" 
                        id="campaign_logindate" 
                        class="form-control form-control-sm bg-light" 
                        value={formatDate(company?.campaign_logindate)} 
                        readonly
                    />
                </div>
            </div>

            <div class="col-md-6">
                <div class="form-group">
                    <label for="campaign_active" class="form-label">Active Status</label>
                    <select 
                        id="campaign_active" 
                        class="form-select form-select-sm" 
                        bind:value={company.campaign_active}
                    >
                        <option value={1}>Active</option>
                        <option value={0}>Inactive</option>
                    </select>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
    :global(.form-control), :global(.form-select) {
        border-color: var(--bs-gray-200);
    }

    :global(.form-control:focus), :global(.form-select:focus) {
        border-color: var(--bs-primary);
        box-shadow: 0 0 0 0.25rem rgba(var(--bs-primary-rgb), 0.1);
    }

    :global(.form-control:read-only) {
        background-color: var(--bs-gray-100);
        cursor: not-allowed;
    }

    :global(.form-label) {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--bs-gray-700);
        margin-bottom: 0.5rem;
    }
</style>
