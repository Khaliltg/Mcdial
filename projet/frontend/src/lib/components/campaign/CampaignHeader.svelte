<script>
    export let title = "Campaign Details";
    export let description = "Manage your campaign settings and configuration";
</script>

<div class="card border-0 bg-white/80 backdrop-blur-sm shadow-sm rounded-4 mb-4">
    <div class="card-body p-4">
        <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
            <div>
                <h1 class="h3 mb-1 fw-semibold text-gradient">{title}</h1>
                <p class="text-muted mb-0 fs-6">{description}</p>
            </div>
            <div class="d-flex gap-2">
                <button class="btn btn-light btn-sm rounded-3 d-flex align-items-center gap-2">
                    <i class="bi bi-gear fs-5"></i>
                    <span>Settings</span>
                </button>
                <button class="btn btn-primary btn-sm rounded-3 d-flex align-items-center gap-2">
                    <i class="bi bi-telephone fs-5"></i>
                    <span>Launch Campaign</span>
                </button>
            </div>
        </div>
    </div>
</div>

<style>
    .text-gradient {
        background: linear-gradient(45deg, #2937f0, #9f1ae2);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
    }
</style>
