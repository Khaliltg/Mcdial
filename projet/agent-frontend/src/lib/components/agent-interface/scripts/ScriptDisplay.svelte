<script lang="ts">
  // Types
  interface ScriptSection {
    id: string;
    title: string;
    content: string;
    order: number;
  }
  
  interface Script {
    id: string;
    name: string;
    description?: string;
    sections: ScriptSection[];
  }
  
  // Propriétés
  export let script: Script | null = null;
  export let callActive: boolean = false;
  
  // Variables pour le suivi de la progression
  let currentSectionIndex: number = 0;
  
  // Réinitialiser la progression lorsqu'un nouveau script est chargé
  $: if (script) {
    currentSectionIndex = 0;
  }
  
  // Fonctions de navigation
  function nextSection() {
    if (script && currentSectionIndex < script.sections.length - 1) {
      currentSectionIndex++;
    }
  }
  
  function prevSection() {
    if (currentSectionIndex > 0) {
      currentSectionIndex--;
    }
  }
  
  // Calculer la progression
  $: progress = script ? Math.round(((currentSectionIndex + 1) / script.sections.length) * 100) : 0;
  
  // Obtenir la section actuelle
  $: currentSection = script && script.sections.length > 0 ? script.sections[currentSectionIndex] : null;
</script>

<div class="bg-white rounded-lg shadow-lg p-4">
  <div class="flex justify-between items-center mb-4">
    <h2 class="text-lg font-bold text-gray-800">Script d'appel</h2>
    
    {#if script}
      <div class="text-sm text-gray-500">
        Section {currentSectionIndex + 1} / {script.sections.length}
      </div>
    {/if}
  </div>
  
  {#if !script || !callActive}
    <div class="text-center py-8 text-gray-500">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <p>Aucun script actif</p>
      <p class="text-sm">Le script apparaîtra ici pendant un appel</p>
    </div>
  {:else}
    <!-- Barre de progression -->
    <div class="w-full bg-gray-200 rounded-full h-2 mb-4">
      <div class="bg-blue-600 h-2 rounded-full" style="width: {progress}%"></div>
    </div>
    
    {#if currentSection}
      <div class="mb-4">
        <h3 class="text-md font-semibold text-gray-700 mb-2">{currentSection.title}</h3>
        <div class="bg-blue-50 p-4 rounded-lg text-gray-800 min-h-[200px] border-l-4 border-blue-500">
          {#each currentSection.content.split('\n') as paragraph}
            <p class="mb-2">{paragraph}</p>
          {/each}
        </div>
      </div>
      
      <!-- Navigation -->
      <div class="flex justify-between">
        <button 
          on:click={prevSection}
          class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          disabled={currentSectionIndex === 0}
        >
          Précédent
        </button>
        
        <button 
          on:click={nextSection}
          class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          disabled={currentSectionIndex === script.sections.length - 1}
        >
          Suivant
        </button>
      </div>
    {:else}
      <div class="text-center py-8 text-gray-500">
        <p>Ce script ne contient aucune section</p>
      </div>
    {/if}
  {/if}
</div>
