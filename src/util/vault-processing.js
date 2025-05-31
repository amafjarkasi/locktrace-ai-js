import { SecurityLock } from '../models/request.js';
import { lockInfo, lockError } from './lock-console.js';

/**
 * Process vault file and extract security locks
 * @param {Object} vaultData - Vault file data
 * @returns {Array} Array of SecurityLock objects
 */
export async function processVaultFile(vaultData) {
  lockInfo('🗂️ Analyzing security vault...');
    try {
    console.log('DEBUG: Vault data structure:', typeof vaultData, vaultData ? Object.keys(vaultData) : 'null/undefined');
    
    const securityLocks = [];
    const entries = vaultData.log?.entries || [];
    console.log('DEBUG: Found entries:', entries.length);
    
    for (const entry of entries) {
      const request = entry.request;
      if (!request) continue;
      
      // Skip certain request types that are not useful for security analysis
      if (shouldSkipRequest(request)) {
        continue;
      }
      
      const processedLock = await processVaultEntry(entry);
      if (processedLock) {
        securityLocks.push(processedLock);
      }
    }
    
    lockInfo(`✅ Analyzed ${securityLocks.length} security locks from vault`);
    return securityLocks;  } catch (error) {
    lockError(`Failed to analyze security vault: ${error.message}`);
    throw error;
  }
}

/**
 * Process a single vault entry
 * @param {Object} entry - Vault entry
 * @returns {SecurityLock|null} SecurityLock object or null if should be skipped
 */
async function processVaultEntry(entry) {
  try {
    const request = entry.request;
    const method = request.method;
    const url = request.url;
    
    // Extract headers
    const headers = {};
    if (request.headers) {
      request.headers.forEach(header => {
        headers[header.name] = header.value;
      });
    }
    
    // Extract query parameters
    const queryParams = {};
    if (request.queryString && request.queryString.length > 0) {
      request.queryString.forEach(param => {
        queryParams[param.name] = param.value;
      });
    }
    
    // Extract body
    let body = null;
    if (request.postData && request.postData.text) {
      try {
        // Try to parse as JSON
        body = JSON.parse(request.postData.text);
      } catch {
        // If not JSON, keep as string
        body = request.postData.text;
      }
    }
      return new SecurityLock(
      method,
      url,
      headers,
      Object.keys(queryParams).length > 0 ? queryParams : null,
      body
    );
  } catch (error) {
    lockError(`Failed to process vault entry: ${error.message}`);
    return null;
  }
}

/**
 * Check if a request should be skipped
 * @param {Object} request - HAR request object
 * @returns {boolean} True if request should be skipped
 */
function shouldSkipRequest(request) {
  const url = request.url.toLowerCase();
  const method = request.method.toUpperCase();
  
  // Skip static resources
  const staticExtensions = [
    '.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2',
    '.ttf', '.eot', '.map', '.webp', '.avif', '.mp4', '.webm', '.ogg'
  ];
  
  if (staticExtensions.some(ext => url.includes(ext))) {
    return true;
  }
  
  // Skip common tracking and analytics
  const skipDomains = [
    'google-analytics.com',
    'googletagmanager.com',
    'facebook.com/tr',
    'doubleclick.net',
    'googlesyndication.com',
    'google.com/pagead',
    'amazon-adsystem.com',
    'jsdelivr.net',
    'unpkg.com',
    'cdnjs.cloudflare.com'
  ];
  
  if (skipDomains.some(domain => url.includes(domain))) {
    return true;
  }
  
  // Skip preflight OPTIONS requests
  if (method === 'OPTIONS') {
    return true;
  }
  
  // Skip some common polling endpoints
  if (url.includes('/ping') || url.includes('/health') || url.includes('/heartbeat')) {
    return true;
  }
  
  return false;
}

/**
 * Filter security locks by criteria
 * @param {Array} securityLocks - Array of SecurityLock objects
 * @param {Object} criteria - Filter criteria
 * @returns {Array} Filtered security locks
 */
export function filterSecurityLocks(securityLocks, criteria = {}) {
  let filtered = [...securityLocks];
    if (criteria.method) {
    filtered = filtered.filter(lock => 
      lock.method.toUpperCase() === criteria.method.toUpperCase()
    );
  }
  
  if (criteria.domain) {
    filtered = filtered.filter(lock => {
      try {
        const url = new URL(lock.url);
        return url.hostname.includes(criteria.domain);
      } catch {
        return false;
      }
    });
  }
    if (criteria.path) {
    filtered = filtered.filter(lock => {
      try {
        const url = new URL(lock.url);
        return url.pathname.includes(criteria.path);
      } catch {
        return false;
      }
    });
  }
  
  if (criteria.hasBody !== undefined) {
    filtered = filtered.filter(lock => !!lock.body === criteria.hasBody);
  }
  
  return filtered;
}

/**
 * Group security locks by security domain
 * @param {Array} securityLocks - Array of SecurityLock objects
 * @returns {Object} Grouped locks by security domain
 */
export function groupLocksByDomain(securityLocks) {
  const grouped = {};
  
  securityLocks.forEach(lock => {
    try {
      const url = new URL(lock.url);
      const domain = url.hostname;
      
      if (!grouped[domain]) {
        grouped[domain] = [];
      }
      
      grouped[domain].push(lock);
    } catch (error) {
      // Invalid URL, skip
    }
  });
  
  return grouped;
}

/**
 * Find security locks with similar patterns
 * @param {Array} securityLocks - Array of SecurityLock objects
 * @returns {Array} Array of lock groups with similar patterns
 */
export function findSimilarLocks(securityLocks) {
  const patterns = {};
  
  securityLocks.forEach(lock => {
    try {
      const url = new URL(lock.url);
      // Create pattern by replacing numbers and IDs
      const pattern = url.pathname
        .replace(/\/\d+/g, '/{id}')
        .replace(/\/[a-f0-9-]{36}/g, '/{uuid}')
        .replace(/\/[a-f0-9]{24}/g, '/{objectId}');
      
      const key = `${lock.method}:${pattern}`;
      
      if (!patterns[key]) {
        patterns[key] = [];
      }
      
      patterns[key].push(lock);
    } catch (error) {
      // Invalid URL, skip
    }
  });
  
  // Return only groups with multiple locks
  return Object.entries(patterns)
    .filter(([_, locks]) => locks.length > 1)
    .map(([pattern, locks]) => ({ pattern, locks }));
}

/**
 * Extract dynamic values from security lock URLs and bodies
 * @param {Array} securityLocks - Array of SecurityLock objects
 * @returns {Object} Object containing identified dynamic values
 */
export function extractDynamicValues(securityLocks) {
  const dynamicValues = {
    ids: new Set(),
    tokens: new Set(),
    timestamps: new Set(),
    userIds: new Set()
  };
    securityLocks.forEach(lock => {
    try {
      const url = new URL(lock.url);
      
      // Extract from URL path
      const pathParts = url.pathname.split('/');
      pathParts.forEach(part => {
        // Look for numeric IDs
        if (/^\d+$/.test(part)) {
          dynamicValues.ids.add(part);
        }
        
        // Look for UUIDs
        if (/^[a-f0-9-]{36}$/i.test(part)) {
          dynamicValues.ids.add(part);
        }
        
        // Look for tokens (long alphanumeric strings)
        if (/^[a-zA-Z0-9]{20,}$/.test(part)) {
          dynamicValues.tokens.add(part);
        }
      });
      
      // Extract from query parameters
      url.searchParams.forEach((value, key) => {
        if (/^(timestamp|time|ts)$/i.test(key)) {
          dynamicValues.timestamps.add(value);
        }
        
        if (/^(user|userId|uid)$/i.test(key)) {
          dynamicValues.userIds.add(value);
        }
      });
        // Extract from lock body
      if (lock.body && typeof lock.body === 'object') {
        extractDynamicFromObject(lock.body, dynamicValues);
      }
        } catch (error) {
      // Skip invalid security locks
    }
  });
  
  // Convert Sets to Arrays
  return {
    ids: Array.from(dynamicValues.ids),
    tokens: Array.from(dynamicValues.tokens),
    timestamps: Array.from(dynamicValues.timestamps),
    userIds: Array.from(dynamicValues.userIds)
  };
}

/**
 * Extract dynamic values from object recursively
 * @param {Object} obj - Object to extract from
 * @param {Object} dynamicValues - Object to store dynamic values
 */
function extractDynamicFromObject(obj, dynamicValues) {
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      // Look for IDs
      if (/^(id|_id|objectId)$/i.test(key) && value) {
        dynamicValues.ids.add(value);
      }
      
      // Look for timestamps
      if (/timestamp|time|created|updated/i.test(key) && value) {
        dynamicValues.timestamps.add(value);
      }
      
      // Look for user IDs
      if (/user|uid/i.test(key) && value) {
        dynamicValues.userIds.add(value);
      }
    } else if (typeof value === 'object' && value !== null) {
      extractDynamicFromObject(value, dynamicValues);
    }
  }
}
