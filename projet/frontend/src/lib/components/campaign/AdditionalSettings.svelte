<script>
    export let company;
</script>

<div class="card border shadow-sm rounded-3">
    <div class="card-header bg-primary bg-opacity-10 py-3">
        <div class="d-flex align-items-center gap-2">
            <i class="bi bi-gear-wide-connected text-primary fs-5"></i>
            <h5 class="mb-0 fw-semibold">Paramètres Additionnels</h5>
        </div>
    </div>
    <div class="card-body p-4">
        <div class="row g-3">
            <div class="col-md-6 mb-3">
                <div class="form-group">
                    <label for="hopper_level" class="form-label d-flex align-items-center gap-2">
                        <i class="bi bi-stack text-primary"></i>
                        <span>Hopper Level</span>
                    </label>
                    <div class="input-group input-group-sm">
                        <input 
                            type="number" 
                            id="hopper_level" 
                            class="form-control" 
                            bind:value={company.hopper_level}
                            min="1"
                            placeholder="Enter hopper level"
                        >
                        <span class="input-group-text bg-light">leads</span>
                    </div>
                    <small class="text-muted d-block mt-1">Number of leads to maintain in the hopper</small>
                </div>
            </div>
            
            <div class="col-md-6 mb-3">
                <div class="form-group">
                    <label for="local_call_time" class="form-label d-flex align-items-center gap-2">
                        <i class="bi bi-clock text-primary"></i>
                        <span>Local Call Time</span>
                    </label>
                    <input 
                        type="text" 
                        id="local_call_time" 
                        class="form-control form-control-sm" 
                        bind:value={company.local_call_time}
                        placeholder="Enter local call time"
                    >
                    <small class="text-muted d-block mt-1">Time zone setting for outbound calls</small>
                </div>
            </div>
            
            <div class="col-md-6 mb-3">
                <div class="form-group">
                    <label for="auto_dial_level" class="form-label d-flex align-items-center gap-2">
                        <i class="bi bi-speedometer2 text-primary"></i>
                        <span>Auto Dial Level</span>
                    </label>
                    <div class="input-group input-group-sm">
                        <input 
                            type="number" 
                            id="auto_dial_level" 
                            class="form-control" 
                            bind:value={company.auto_dial_level}
                            min="1"
                            placeholder="Enter auto dial level"
                        >
                        <span class="input-group-text bg-light">x</span>
                    </div>
                    <small class="text-muted d-block mt-1">Calls per agent ratio (predictive dialing)</small>
                </div>
            </div>
            
            <div class="col-md-6 mb-3">
                <div class="form-group">
                    <label for="next_agent_call" class="form-label d-flex align-items-center gap-2">
                        <i class="bi bi-people text-primary"></i>
                        <span>Next Agent Call</span>
                    </label>
                    <select 
                        id="next_agent_call" 
                        class="form-select form-select-sm" 
                        bind:value={company.next_agent_call}
                    >
                        <option value="random">Random</option>
                        <option value="oldest_call_start">Oldest Call Start</option>
                        <option value="oldest_call_finish">Oldest Call Finish</option>
                    </select>
                    <small class="text-muted d-block mt-1">Agent selection logic for incoming calls</small>
                </div>
            </div>
        </div>
    </div>
</div>
