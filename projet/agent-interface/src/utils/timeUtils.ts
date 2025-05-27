/**
 * Formate une durée en secondes au format HH:MM:SS
 * @param seconds Durée en secondes
 * @returns Chaîne formatée au format HH:MM:SS
 */
export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) {
    return "00:00:00"
  }

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  return [
    hours.toString().padStart(2, "0"),
    minutes.toString().padStart(2, "0"),
    secs.toString().padStart(2, "0"),
  ].join(":")
}

/**
 * Formate une durée en secondes au format court (HH:MM:SS ou MM:SS)
 * @param seconds Durée en secondes
 * @param showHours Afficher les heures même si elles sont à zéro
 * @returns Chaîne formatée
 */
export function formatTimeShort(seconds: number, showHours = false): string {
  if (isNaN(seconds) || seconds < 0) {
    return showHours ? "00:00:00" : "00:00"
  }

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours > 0 || showHours) {
    return [
      hours.toString().padStart(2, "0"),
      minutes.toString().padStart(2, "0"),
      secs.toString().padStart(2, "0"),
    ].join(":")
  }

  return [minutes.toString().padStart(2, "0"), secs.toString().padStart(2, "0")].join(":")
}

/**
 * Formate une date au format local
 * @param date Date à formater
 * @param includeTime Inclure l'heure dans le format
 * @returns Chaîne formatée
 */
export function formatDate(date: Date | string, includeTime = false): string {
  if (!date) return ""

  const dateObj = typeof date === "string" ? new Date(date) : date

  if (isNaN(dateObj.getTime())) {
    return ""
  }

  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  }

  if (includeTime) {
    options.hour = "2-digit"
    options.minute = "2-digit"
  }

  return dateObj.toLocaleDateString(undefined, options)
}

/**
 * Formate une heure au format local
 * @param date Date à formater
 * @param includeSeconds Inclure les secondes dans le format
 * @returns Chaîne formatée
 */
export function formatTime24h(date: Date | string, includeSeconds = false): string {
  if (!date) return ""

  const dateObj = typeof date === "string" ? new Date(date) : date

  if (isNaN(dateObj.getTime())) {
    return ""
  }

  const options: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }

  if (includeSeconds) {
    options.second = "2-digit"
  }

  return dateObj.toLocaleTimeString(undefined, options)
}

/**
 * Calcule la différence en secondes entre deux dates
 * @param start Date de début
 * @param end Date de fin (par défaut: maintenant)
 * @returns Différence en secondes
 */
export function getTimeDifferenceInSeconds(start: Date | string, end: Date | string = new Date()): number {
  const startDate = typeof start === "string" ? new Date(start) : start
  const endDate = typeof end === "string" ? new Date(end) : end

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return 0
  }

  return Math.floor((endDate.getTime() - startDate.getTime()) / 1000)
}

/**
 * Formate une durée en secondes en texte descriptif (1h 30m 15s)
 * @param seconds Durée en secondes
 * @param shortFormat Utiliser un format court (1h 30m)
 * @returns Chaîne formatée
 */
export function formatDurationText(seconds: number, shortFormat = false): string {
  if (isNaN(seconds) || seconds < 0) {
    return "0s"
  }

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  const parts = []

  if (hours > 0) {
    parts.push(`${hours}h`)
  }

  if (minutes > 0 || (hours > 0 && !shortFormat)) {
    parts.push(`${minutes}m`)
  }

  if (!shortFormat || (seconds < 60 && parts.length === 0)) {
    parts.push(`${secs}s`)
  }

  return parts.join(" ")
}
