import { jest } from '@jest/globals';
import { MasterLocksmith } from '../src/agent.js';
import { SecurityLock } from '../src/models/request.js';
import { LockchainManager } from '../src/models/lockchain-manager.js';
import { processVaultFile } from '../src/util/vault-processing.js';

describe('MasterLocksmith', () => {
  let locksmith;
  
  beforeEach(() => {
    locksmith = new MasterLocksmith(
      'Test security objective',
      './test-vault.har',
      './test-keys.json',
      false
    );
  });

  test('should initialize with correct security parameters', () => {
    expect(locksmith.target).toBe('Test security objective');
    expect(locksmith.vaultFilePath).toBe('./test-vault.har');
    expect(locksmith.keysPath).toBe('./test-keys.json');
    expect(locksmith.shouldForgeCode).toBe(false);
  });

  test('should have required locksmith methods', () => {
    expect(typeof locksmith.analyzeVault).toBe('function');
    expect(typeof locksmith.forgeLockchain).toBe('function');
    expect(typeof locksmith.pickLock).toBe('function');
    expect(typeof locksmith.forgeSecrets).toBe('function');    expect(typeof locksmith.completeOperation).toBe('function');
  });
});

describe('SecurityLock', () => {
  test('should create security lock with all parameters', () => {
    const headers = { 'Content-Type': 'application/json' };
    const queryParams = { page: '1', limit: '10' };
    const body = { name: 'test' };
    
    const securityLock = new SecurityLock('POST', 'https://api.example.com/users', headers, queryParams, body);
    
    expect(securityLock.method).toBe('POST');
    expect(securityLock.url).toBe('https://api.example.com/users');
    expect(securityLock.headers).toEqual(headers);
    expect(securityLock.queryParams).toEqual(queryParams);
    expect(securityLock.body).toEqual(body);
  });

  test('should generate lockpicking command', () => {
    const securityLock = new SecurityLock('GET', 'https://api.example.com/users', {
      'Authorization': 'Bearer token123'
    });
    
    const lockPickCommand = securityLock.toLockPickCommand();
    expect(lockPickCommand).toContain('curl -X GET');
    expect(lockPickCommand).toContain('-H \'Authorization: Bearer token123\'');
    expect(lockPickCommand).toContain('https://api.example.com/users');
  });
  test('should generate unlock secrets code', () => {
    const securityLock = new SecurityLock('POST', 'https://api.example.com/users', {
      'Content-Type': 'application/json'
    }, null, { name: 'John' });
    
    const unlockCode = securityLock.toUnlockCode();
    expect(unlockCode).toContain('fetch(\'https://api.example.com/users\'');
    expect(unlockCode).toContain('method: "POST"');
    expect(unlockCode).toContain('Content-Type');
  });

  test('should clone security lock correctly', () => {
    const original = new SecurityLock('POST', 'https://api.example.com/users', {
      'Content-Type': 'application/json'
    }, { page: '1' }, { name: 'John' });
    
    const cloned = original.clone();
    
    expect(cloned.method).toBe(original.method);
    expect(cloned.url).toBe(original.url);
    expect(cloned.headers).toEqual(original.headers);
    expect(cloned.queryParams).toEqual(original.queryParams);
    expect(cloned.body).toEqual(original.body);
    
    // Ensure deep copy
    expect(cloned.headers).not.toBe(original.headers);
    expect(cloned.body).not.toBe(original.body);
  });
});

describe('LockchainManager', () => {  let lockchainManager;
  
  beforeEach(() => {
    lockchainManager = new LockchainManager();
  });

  test('should initialize empty lockchain', () => {
    expect(lockchainManager.locks).toEqual([]);
    expect(lockchainManager.securityLinks).toEqual([]);
  });

  test('should forge lockchain from security locks', () => {
    const securityLocks = [
      new SecurityLock('GET', 'https://api.example.com/users', {}),
      new SecurityLock('POST', 'https://api.example.com/users', {}, null, { name: 'John' })
    ];
    
    const lockchain = lockchainManager.forgeFromRequests(securityLocks, 'Test security analysis');
    
    expect(lockchain.locks).toHaveLength(2);
    expect(lockchain.locks[0]).toHaveProperty('id');
    expect(lockchain.locks[0]).toHaveProperty('name');
    expect(lockchain.locks[0]).toHaveProperty('request');
  });

  test('should calculate difficulty correctly', () => {
    const getLock = new SecurityLock('GET', 'https://api.example.com/users', {});
    const postLock = new SecurityLock('POST', 'https://api.example.com/users', {}, null, { name: 'John' });
    
    const getDifficulty = lockchainManager.calculateDifficulty(getLock);
    const postDifficulty = lockchainManager.calculateDifficulty(postLock);    
    expect(postDifficulty).toBeGreaterThan(getDifficulty);
  });

  test('should generate meaningful lock names', () => {
    const securityLock = new SecurityLock('POST', 'https://api.example.com/users/profile', {});
    const name = lockchainManager.generateLockName(securityLock);
    
    expect(name).toBe('POST_profile');
  });

  test('should find pickable locks', () => {
    const securityLocks = [
      new SecurityLock('GET', 'https://api.example.com/users', {}),
      new SecurityLock('POST', 'https://api.example.com/users', {})
    ];
    
    lockchainManager.forgeFromRequests(securityLocks, 'Test security analysis');
    const pickable = lockchainManager.getPickableLocks();
    
    expect(Array.isArray(pickable)).toBe(true);
    expect(pickable.length).toBeGreaterThan(0);
  });
});

describe('Vault Processing', () => {
  test('should handle empty vault data', async () => {
    const emptyVault = { log: { entries: [] } };
    const securityLocks = await processVaultFile(emptyVault);
    
    expect(Array.isArray(securityLocks)).toBe(true);    expect(securityLocks).toHaveLength(0);
  });

  test('should process valid vault entry', async () => {
    const vaultData = {
      log: {
        entries: [
          {
            request: {
              method: 'GET',
              url: 'https://api.example.com/users',
              headers: [
                { name: 'Content-Type', value: 'application/json' }
              ],
              queryString: [
                { name: 'page', value: '1' }
              ]
            }
          }
        ]
      }
    };
    
    const securityLocks = await processVaultFile(vaultData);
    
    expect(securityLocks).toHaveLength(1);
    expect(securityLocks[0].method).toBe('GET');
    expect(securityLocks[0].url).toBe('https://api.example.com/users');
    expect(securityLocks[0].headers['Content-Type']).toBe('application/json');
  });
});

describe('Integration Tests', () => {
  test('should create a complete locksmith workflow', () => {
    // This would test the entire locksmith workflow
    // For now, just verify the main components work together
    const locksmith = new MasterLocksmith('Test security goal', './test-vault.har', './test-keys.json', true);
    const lockchainManager = new LockchainManager();
    
    expect(locksmith).toBeDefined();
    expect(lockchainManager).toBeDefined();
    
    // Test that they can work together
    const mockSecurityLocks = [
      new SecurityLock('GET', 'https://api.example.com/auth', {}),
      new SecurityLock('POST', 'https://api.example.com/action', {})    ];
    
    const lockchain = lockchainManager.buildFromSecurityLocks(mockSecurityLocks, 'Mock security analysis');
    expect(lockchain.nodes).toHaveLength(2);
  });
});
