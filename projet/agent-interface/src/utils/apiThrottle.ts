// Utilitaire pour limiter les appels API et éviter les erreurs 429 (Too Many Requests)

// Variables pour limiter les appels API trop fréquents
let lastApiCallTime = 0;
const MIN_API_CALL_INTERVAL = 5000; // 5 secondes minimum entre les appels API

/**
 * Vérifie si on peut faire un appel API en fonction du temps écoulé depuis le dernier appel
 * @returns {boolean} true si on peut faire un appel API, false sinon
 */
export function canMakeApiCall(): boolean {
  const now = Date.now();
  
  // Si le temps écoulé depuis le dernier appel est inférieur à l'intervalle minimum, on ne peut pas faire d'appel
  if (now - lastApiCallTime < MIN_API_CALL_INTERVAL) {
    console.log(`Appel API ignoré - Dernier appel il y a ${now - lastApiCallTime}ms`);
    return false;
  }
  
  // Mettre à jour le timestamp du dernier appel
  lastApiCallTime = now;
  return true;
}

/**
 * Enregistre un appel API pour la limitation de débit
 */
export function recordApiCall(): void {
  lastApiCallTime = Date.now();
}

/**
 * Retourne le temps restant avant de pouvoir faire un nouvel appel API
 * @returns {number} Temps en ms avant de pouvoir faire un nouvel appel API (0 si on peut déjà le faire)
 */
export function getTimeUntilNextApiCall(): number {
  const now = Date.now();
  const elapsed = now - lastApiCallTime;
  
  if (elapsed >= MIN_API_CALL_INTERVAL) {
    return 0;
  }
  
  return MIN_API_CALL_INTERVAL - elapsed;
}
