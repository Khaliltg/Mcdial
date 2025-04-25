<script lang="ts">
  // Informations de l'agent
  export let agentName: string = "Agent";
  export let agentId: string = "";
  export let extension: string = "";
  export let campaign: string = "";
  export let status: string = "Disponible";
  
  // Statistiques d'appels
  export let callsToday: number = 0;
  export let callsCompleted: number = 0;
  export let successRate: number = 0;
  
  // Fonctions
  export let onPause: () => void;
  export let onResume: () => void;
  export let onLogout: () => void;
  
  // État de pause
  let isPaused: boolean = false;
  
  function togglePause() {
    isPaused = !isPaused;
    if (isPaused) {
      onPause();
    } else {
      onResume();
    }
  }
</script>

<div class="bg-gradient-to-r from-blue-700 to-blue-900 text-white p-4 shadow-lg">
  <div class="container mx-auto">
    <div class="flex flex-wrap items-center justify-between">
      <!-- Logo et informations agent -->
      <div class="flex items-center space-x-4">
        <div class="text-xl font-bold">McDial</div>
        <div class="bg-blue-800 px-3 py-1 rounded-lg">
          <span class="font-semibold">{agentName}</span>
          <span class="text-sm opacity-75">#{agentId}</span>
        </div>
      </div>
      
      <!-- Statut et campagne -->
      <div class="flex items-center space-x-4">
        <div class="bg-blue-800 px-3 py-1 rounded-lg">
          <span class="text-sm">Campagne:</span>
          <span class="font-semibold">{campaign}</span>
        </div>
        <div class="bg-blue-800 px-3 py-1 rounded-lg">
          <span class="text-sm">Extension:</span>
          <span class="font-semibold">{extension}</span>
        </div>
        <div class="bg-blue-800 px-3 py-1 rounded-lg flex items-center">
          <span class="text-sm mr-2">Statut:</span>
          <span class="font-semibold flex items-center">
            <span class={isPaused ? "text-yellow-300" : "text-green-300"}>●</span>
            <span class="ml-1">{isPaused ? "En pause" : status}</span>
          </span>
        </div>
      </div>
      
      <!-- Statistiques -->
      <div class="flex items-center space-x-4">
        <div class="bg-blue-800 px-3 py-1 rounded-lg">
          <span class="text-sm">Appels aujourd'hui:</span>
          <span class="font-semibold">{callsToday}</span>
        </div>
        <div class="bg-blue-800 px-3 py-1 rounded-lg">
          <span class="text-sm">Complétés:</span>
          <span class="font-semibold">{callsCompleted}</span>
        </div>
        <div class="bg-blue-800 px-3 py-1 rounded-lg">
          <span class="text-sm">Taux de succès:</span>
          <span class="font-semibold">{successRate}%</span>
        </div>
      </div>
      
      <!-- Actions -->
      <div class="flex items-center space-x-2">
        <button 
          on:click={togglePause} 
          class={`px-4 py-2 rounded-lg font-medium transition-colors ${isPaused ? 'bg-green-500 hover:bg-green-600' : 'bg-yellow-500 hover:bg-yellow-600'}`}
        >
          {isPaused ? 'Reprendre' : 'Pause'}
        </button>
        <button 
          on:click={onLogout} 
          class="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Déconnexion
        </button>
      </div>
    </div>
  </div>
</div>
