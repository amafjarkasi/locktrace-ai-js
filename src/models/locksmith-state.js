/**
 * Locksmith State class representing the current state of the master locksmith operation
 */
export class LocksmithState {
  constructor() {
    this.masterLock = null;
    this.currentPick = null;
    this.pendingLocks = [];
    this.pickedSecrets = [];
    this.targetUrl = "";
    this.lockVariables = {};
    this.target = "";
    this.vaultFilePath = "";
    this.keysPath = "";
    this.shouldForgeCode = false;
    this.vaultRequests = [];
    this.securityAnalysis = null;
    this.lockchain = null;
    this.forgedSecrets = null;
    this.secretsFilePath = null;
    this.operationSummary = null;
    this.step = "initialized";
  }

  /**
   * Update the locksmith state with new values
   * @param {Object} updates - Object containing state updates
   * @returns {LocksmithState} New state instance with updates applied
   */
  update(updates) {
    const newState = new LocksmithState();
    
    // Copy current state
    Object.assign(newState, this);
    
    // Apply updates
    Object.assign(newState, updates);
    
    return newState;
  }

  /**
   * Get the current step in the lockpicking operation
   * @returns {string} Current step
   */
  getCurrentStep() {
    return this.step;
  }

  /**
   * Check if the master lock has been identified
   * @returns {boolean} True if master lock is identified
   */
  hasMasterLock() {
    return this.masterLock !== null;
  }

  /**
   * Check if there are pending locks to pick
   * @returns {boolean} True if there are pending locks
   */
  hasPendingLocks() {
    return this.pendingLocks && this.pendingLocks.length > 0;
  }

  /**
   * Get the number of successfully picked locks
   * @returns {number} Number of picked locks
   */
  getPickedLocksCount() {
    return this.pickedSecrets.length;
  }

  /**
   * Add a picked secret to the collection
   * @param {Object} secret - The picked secret
   */
  addPickedSecret(secret) {
    this.pickedSecrets.push(secret);
  }

  /**
   * Get the current lock being picked
   * @returns {Object|null} Current lock or null
   */
  getCurrentPick() {
    return this.currentPick;
  }

  /**
   * Get all lock variables
   * @returns {Object} Lock variables object
   */
  getLockVariables() {
    return this.lockVariables || {};
  }

  /**
   * Set a lock variable
   * @param {string} key - Variable key
   * @param {any} value - Variable value
   */
  setLockVariable(key, value) {
    if (!this.lockVariables) {
      this.lockVariables = {};
    }
    this.lockVariables[key] = value;
  }

  /**
   * Get a formatted status string for logging
   * @returns {string} Status string
   */
  getStatusString() {
    return `Step: ${this.step}, Master Lock: ${this.masterLock?.name || 'Not found'}, Pending: ${this.pendingLocks?.length || 0}, Picked: ${this.getPickedLocksCount()}`;
  }
}
