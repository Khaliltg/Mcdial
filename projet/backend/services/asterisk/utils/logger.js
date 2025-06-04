/**
 * Utilitaire de logging pour le service Asterisk
 */
class AsteriskLogger {
  constructor(moduleName = "Asterisk") {
    this.moduleName = moduleName
  }

  log(level, message, data = null) {
    const timestamp = new Date().toISOString()
    const logMessage = `[${timestamp}] [${this.moduleName}] [${level.toUpperCase()}] ${message}`

    if (data) {
      console.log(logMessage, data)
    } else {
      console.log(logMessage)
    }
  }

  info(message, data = null) {
    this.log("info", message, data)
  }

  warn(message, data = null) {
    this.log("warn", message, data)
  }

  error(message, data = null) {
    this.log("error", message, data)
  }

  debug(message, data = null) {
    if (process.env.NODE_ENV === "development") {
      this.log("debug", message, data)
    }
  }
}

module.exports = AsteriskLogger
