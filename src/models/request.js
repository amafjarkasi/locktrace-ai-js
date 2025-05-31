export class SecurityLock {
  constructor(method, url, headers = {}, queryParams = {}, body = null) {
    this.method = method;
    this.url = url;
    this.headers = headers;
    this.queryParams = queryParams;
    this.body = body;
    this.difficulty = this.assessLockDifficulty();
    this.prerequisites = [];
    this.lockType = this.determineLockType();
  }

  /**
   * Assess the difficulty level of picking this security lock
   */
  assessLockDifficulty() {
    let difficulty = 1;
    
    // Authentication locks are harder to pick
    if (this.requiresAuthentication()) {
      difficulty += 2;
    }
    
    // POST/PUT/DELETE operations require more finesse
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(this.method)) {
      difficulty += 1;
    }
    
    // Complex payloads increase difficulty
    if (this.body && typeof this.body === 'object') {
      difficulty += 1;
    }
    
    // Multiple query parameters suggest complexity
    if (Object.keys(this.queryParams).length > 3) {
      difficulty += 1;
    }
    
    return Math.min(difficulty, 5); // Cap at 5 (master level)
  }

  /**
   * Determine the type of security lock
   */
  determineLockType() {
    if (this.url.includes('/auth') || this.url.includes('/login')) {
      return 'AUTHENTICATION_LOCK';
    }
    if (this.url.includes('/api/')) {
      return 'API_LOCK';
    }
    if (this.method === 'GET') {
      return 'RECONNAISSANCE_LOCK';
    }
    if (['POST', 'PUT', 'PATCH'].includes(this.method)) {
      return 'EXECUTION_LOCK';
    }
    if (this.method === 'DELETE') {
      return 'DESTRUCTION_LOCK';
    }
    return 'STANDARD_LOCK';
  }

  /**
   * Check if this lock requires authentication prerequisites
   */
  requiresAuthentication() {
    return this.headers['Authorization'] || 
           this.headers['Cookie'] || 
           this.headers['X-Auth-Token'] ||
           this.url.includes('/api/');
  }

  /**
   * Add a prerequisite lock that must be picked first
   */
  addPrerequisite(prerequisiteLock) {
    this.prerequisites.push(prerequisiteLock);
  }

  /**
   * Convert to curl lockpicking command
   */
  toCurlCommand() {
    let curl = `curl -X ${this.method}`;
    
    // Add URL with query parameters
    const url = new URL(this.url);
    Object.entries(this.queryParams).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
    curl += ` "${url.toString()}"`;
    
    // Add headers for lockpicking
    Object.entries(this.headers).forEach(([key, value]) => {
      curl += ` -H "${key}: ${value}"`;
    });
    
    // Add body payload if present
    if (this.body) {
      if (typeof this.body === 'string') {
        curl += ` -d '${this.body}'`;
      } else {
        curl += ` -d '${JSON.stringify(this.body)}'`;
      }
    }
    
    return curl;
  }

  /**
   * Convert to fetch() lockpicking code
   */
  toFetchCode() {
    const options = {
      method: this.method,
      headers: { ...this.headers }
    };

    if (this.body) {
      if (typeof this.body === 'string') {
        options.body = this.body;
      } else {
        options.body = JSON.stringify(this.body);
        options.headers['Content-Type'] = 'application/json';
      }
    }

    // Build URL with query parameters
    const url = new URL(this.url);
    Object.entries(this.queryParams).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    return `
// Security Lock: ${this.lockType} (Difficulty: ${this.difficulty}/5)
const response = await fetch('${url.toString()}', ${JSON.stringify(options, null, 2)});
const data = await response.json();`;
  }

  /**
   * Generate lockpicking strategy description
   */
  getLockpickingStrategy() {
    const strategies = {
      'AUTHENTICATION_LOCK': 'Master key required - extract credentials from previous locks',
      'API_LOCK': 'Standard API lockpicking - ensure proper headers and payload formatting',
      'RECONNAISSANCE_LOCK': 'Information gathering - low risk, high intel value',
      'EXECUTION_LOCK': 'Action execution - requires careful payload construction',
      'DESTRUCTION_LOCK': 'Destructive operation - proceed with extreme caution',
      'STANDARD_LOCK': 'Basic lock - standard lockpicking techniques apply'
    };
    
    return strategies[this.lockType] || 'Unknown lock type - proceed carefully';
  }

  /**
   * Check if this lock can be picked without prerequisites
   */
  canPickIndependently() {
    return this.prerequisites.length === 0 && 
           !this.requiresAuthentication();
  }

  /**
   * Generate a unique identifier for this security lock
   */
  generateLockId() {
    const urlPath = new URL(this.url).pathname;
    const methodHash = this.method.toLowerCase();
    return `${methodHash}_${urlPath.replace(/\//g, '_').replace(/[^a-zA-Z0-9_]/g, '')}`;
  }

  /**
   * Extract dynamic values that might be used as keys for other locks
   */
  extractPotentialKeys() {
    const keys = [];
    
    // Extract from response (would need to be set after execution)
    if (this.responseData) {
      // Common key fields to look for
      const keyFields = ['id', 'token', 'sessionId', 'key', 'authToken', 'csrf'];
      keyFields.forEach(field => {
        if (this.responseData[field]) {
          keys.push({
            name: field,
            value: this.responseData[field],
            type: 'response_extract'
          });
        }
      });
    }
    
    return keys;
  }

  /**
   * Create a copy of this lock with modified parameters for lockpicking
   */
  createVariant(modifications = {}) {
    return new SecurityLock(
      modifications.method || this.method,
      modifications.url || this.url,
      { ...this.headers, ...(modifications.headers || {}) },
      { ...this.queryParams, ...(modifications.queryParams || {}) },
      modifications.body !== undefined ? modifications.body : this.body
    );
  }

  toString() {
    return `SecurityLock[${this.lockType}] ${this.method} ${this.url} (Difficulty: ${this.difficulty}/5)`;
  }
}

// Legacy export for backward compatibility during transition
export { SecurityLock as Request };
