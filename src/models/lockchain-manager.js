/**
 * Lockchain Manager for handling security lock dependencies and picking order
 */
export class LockchainManager {
  constructor() {
    this.locks = [];
    this.securityLinks = [];
  }

  /**
   * Forge lockchain from vault requests and security analysis
   * @param {Array} requests - Array of security request objects
   * @param {string} analysis - Master Key analysis of the security patterns
   * @returns {Object} Lockchain object with locks and security links
   */
  forgeFromRequests(requests, analysis) {
    this.locks = [];
    this.securityLinks = [];

    // Convert security requests to locks
    requests.forEach((request, index) => {
      const lock = {
        id: index,
        name: this.generateLockName(request),
        request: request,
        method: request.method,
        url: request.url,
        picked: false,
        prerequisites: [],
        secrets: [],
        difficulty: this.calculateDifficulty(request)
      };
      
      this.locks.push(lock);
    });

    // Analyze security dependencies based on URL patterns and timing
    this.analyzeSecurityDependencies();

    // Sort locks by difficulty (easiest first for optimal picking order)
    this.locks.sort((a, b) => a.difficulty - b.difficulty);

    return {
      locks: this.locks,
      securityLinks: this.securityLinks
    };
  }

  /**
   * Generate a meaningful name for a security lock
   * @param {Object} request - Request object
   * @returns {string} Lock name
   */
  generateLockName(request) {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    
    if (pathParts.length === 0) {
      return `${request.method}_root_lock`;
    }
    
    const lastPart = pathParts[pathParts.length - 1];
    return `${request.method}_${lastPart}_lock`.toLowerCase();
  }

  /**
   * Calculate the difficulty level of picking a lock
   * @param {Object} request - Request object
   * @returns {number} Difficulty score (1-10, 1 being easiest)
   */
  calculateDifficulty(request) {
    let difficulty = 1;
    
    // GET requests are generally easier
    if (request.method === 'GET') {
      difficulty += 1;
    } else if (request.method === 'POST') {
      difficulty += 3;
    } else if (request.method === 'PUT' || request.method === 'PATCH') {
      difficulty += 4;
    } else if (request.method === 'DELETE') {
      difficulty += 5;
    }
    
    // Authentication makes it harder
    if (this.hasAuthenticationHeaders(request)) {
      difficulty += 2;
    }
    
    // Complex payloads increase difficulty
    if (request.body && Object.keys(request.body).length > 5) {
      difficulty += 2;
    }
    
    // API endpoints with IDs or dynamic parts are more complex
    if (request.url.includes('/api/') && /\/\d+/.test(request.url)) {
      difficulty += 1;
    }
    
    return Math.min(difficulty, 10);
  }

  /**
   * Check if request has authentication headers
   * @param {Object} request - Request object
   * @returns {boolean} True if has auth headers
   */
  hasAuthenticationHeaders(request) {
    const authHeaders = ['authorization', 'cookie', 'x-auth-token', 'x-api-key'];
    return authHeaders.some(header => 
      request.headers && 
      Object.keys(request.headers).some(h => h.toLowerCase().includes(header))
    );
  }

  /**
   * Analyze security dependencies between locks
   */
  analyzeSecurityDependencies() {
    for (let i = 0; i < this.locks.length; i++) {
      for (let j = 0; j < this.locks.length; j++) {
        if (i !== j) {
          const lockA = this.locks[i];
          const lockB = this.locks[j];
          
          // Check if lockB depends on lockA
          if (this.isSecurityPrerequisite(lockA, lockB)) {
            lockB.prerequisites.push(lockA.id);
            this.securityLinks.push({
              from: lockA.id,
              to: lockB.id,
              type: 'security_dependency'
            });
          }
        }
      }
    }
  }

  /**
   * Check if lockA is a security prerequisite for lockB
   * @param {Object} lockA - First lock
   * @param {Object} lockB - Second lock
   * @returns {boolean} True if lockA is prerequisite for lockB
   */
  isSecurityPrerequisite(lockA, lockB) {
    // Simple heuristics for security dependencies
    
    // Login/auth endpoints usually come first
    if (lockA.url.includes('login') || lockA.url.includes('auth')) {
      return true;
    }
    
    // GET usually comes before POST/PUT/DELETE for the same resource
    if (lockA.method === 'GET' && lockB.method !== 'GET') {
      const urlA = new URL(lockA.url);
      const urlB = new URL(lockB.url);
      if (urlA.pathname.includes(urlB.pathname.split('/').slice(0, -1).join('/'))) {
        return true;
      }
    }
    
    // Timestamp-based ordering (earlier requests are likely prerequisites)
    if (lockA.request.timestamp && lockB.request.timestamp) {
      return lockA.request.timestamp < lockB.request.timestamp;
    }
    
    return false;
  }

  /**
   * Find the master lock (main goal endpoint)
   * @param {string} target - The target goal
   * @returns {Object|null} Master lock or null
   */
  findMasterLock(target) {
    // Look for locks that match the target description
    const targetLower = target.toLowerCase();
    
    for (const lock of this.locks) {
      const lockUrl = lock.url.toLowerCase();
      
      // Check if URL contains key terms from target
      const targetWords = targetLower.split(' ');
      const matchedWords = targetWords.filter(word => 
        word.length > 3 && lockUrl.includes(word)
      );
      
      if (matchedWords.length > 0) {
        return lock;
      }
    }
    
    // Fallback to the most complex lock (highest difficulty)
    return this.locks.reduce((master, current) => 
      current.difficulty > (master?.difficulty || 0) ? current : master, null
    );
  }

  /**
   * Get locks that are ready to be picked (no unpicked prerequisites)
   * @returns {Array} Array of pickable locks
   */
  getPendingLocks() {
    return this.locks.filter(lock => {
      if (lock.picked) return false;
      
      // Check if all prerequisites are picked
      return lock.prerequisites.every(prereqId => {
        const prereqLock = this.locks.find(l => l.id === prereqId);
        return prereqLock && prereqLock.picked;
      });
    });
  }

  /**
   * Mark a lock as picked
   * @param {number} lockId - ID of the lock to mark as picked
   * @param {Object} secrets - Extracted secrets from picking the lock
   */
  markLockPicked(lockId, secrets) {
    const lock = this.locks.find(l => l.id === lockId);
    if (lock) {
      lock.picked = true;
      lock.secrets = secrets;
    }
  }

  /**
   * Get statistics about the lockchain
   * @returns {Object} Lockchain statistics
   */
  getStatistics() {
    const pickedCount = this.locks.filter(l => l.picked).length;
    const totalCount = this.locks.length;
    const avgDifficulty = this.locks.reduce((sum, l) => sum + l.difficulty, 0) / totalCount;
    
    return {
      totalLocks: totalCount,
      pickedLocks: pickedCount,
      pendingLocks: totalCount - pickedCount,
      averageDifficulty: avgDifficulty.toFixed(2),
      securityLinks: this.securityLinks.length
    };
  }
}
