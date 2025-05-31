import { MasterKey } from './util/master-key.js';
import { LockchainManager } from './models/lockchain-manager.js';
import { processVaultFile } from './util/vault-processing.js';
import { lockInfo, lockSuccess, lockError } from './util/lock-console.js';
import fs from 'fs-extra';

export class MasterLocksmith {
  constructor(target, vaultFilePath, keysPath, shouldForgeCode) {
    this.target = target;
    this.vaultFilePath = vaultFilePath;
    this.keysPath = keysPath;
    this.shouldForgeCode = shouldForgeCode;
    this.masterKey = MasterKey.getInstance();
    this.lockchainManager = new LockchainManager();
  }

  async analyzeVault(state) {
    lockInfo('🔍 Analyzing digital vault...');
    
    try {
      const vaultData = await fs.readJSON(this.vaultFilePath);
      const lockRequests = await processVaultFile(vaultData);
      
      lockInfo(`📊 Found ${lockRequests.length} security layers in vault`);
      
      // Analyze lock patterns with Master Key to understand the security flow
      const securityAnalysisPrompt = `
        Analyze these security patterns and identify the main unlocking workflow for: "${this.target}"
        
        Security Layers:
        ${lockRequests.map((req, i) => `${i + 1}. ${req.method} ${req.url}`).join('\n')}
        
        Please identify:
        1. The master lock that accomplishes the goal
        2. Any prerequisite security checks needed
        3. The logical flow of lock picking operations
        
        Return a JSON object with the security analysis.
      `;      
      const response = await this.masterKey.invoke([{ role: 'user', content: securityAnalysisPrompt }]);
      
      return {
        ...state,
        vaultRequests: lockRequests,
        securityAnalysis: response.content,
        step: 'vault_analyzed'
      };
    } catch (error) {
      lockError(`Failed to analyze vault: ${error.message}`);
      throw error;
    }
  }

  async forgeLockchain(state) {
    lockInfo('🏗️ Forging lockchain architecture...');
    
    try {
      // Build lockchain from analyzed security layers
      const lockchain = this.lockchainManager.forgeFromRequests(state.vaultRequests, state.securityAnalysis);
      
      // Find the master lock (main goal endpoint)
      const masterLock = this.lockchainManager.findMasterLock(this.target);
      
      // Get locks to be picked
      const pendingLocks = this.lockchainManager.getPendingLocks();
      
      lockInfo(`🏆 Master lock: ${masterLock?.name || 'Not found'}`);
      lockInfo(`� Pending locks: ${pendingLocks.length}`);
      
      return {
        ...state,
        lockchain: lockchain,
        masterLock: masterLock,
        pendingLocks: pendingLocks,
        step: 'lockchain_forged'
      };
    } catch (error) {
      lockError(`Failed to forge lockchain: ${error.message}`);
      throw error;
    }
  }

  async pickLock(state) {
    if (!state.pendingLocks || state.pendingLocks.length === 0) {
      return { ...state, step: 'picking_complete' };
    }

    const lockToPick = state.pendingLocks[0];
    const remainingLocks = state.pendingLocks.slice(1);
    
    lockInfo(`🔓 Picking lock: ${lockToPick.name}`);
    
    try {
      // Pick the lock with Master Key
      const pickingPrompt = `
        Pick this security lock for the goal: "${this.target}"
        
        Lock: ${lockToPick.method} ${lockToPick.url}
        Security Headers: ${JSON.stringify(lockToPick.headers, null, 2)}
        ${lockToPick.body ? `Security Payload: ${JSON.stringify(lockToPick.body, null, 2)}` : ''}
        
        Identify:
        1. What this security lock protects
        2. Required master keys and their types
        3. Dynamic security tokens that need extraction from previous picks
        4. Dependencies on other security layers
        
        Lock variables available: ${JSON.stringify(state.lockVariables)}
      `;
      
      const response = await this.masterKey.invoke([{ role: 'user', content: pickingPrompt }]);
      
      // Mark lock as picked
      lockToPick.picked = true;
      lockToPick.secrets = response.content;
      
      return {
        ...state,
        currentPick: lockToPick,
        pendingLocks: remainingLocks,
        step: 'lock_picked'
      };
    } catch (error) {
      lockError(`Failed to pick lock: ${error.message}`);
      throw error;
    }
  }

  async forgeSecrets(state) {
    if (!this.shouldForgeCode) {
      lockInfo('⏭️ Secret forging skipped');
      return { ...state, step: 'forging_skipped' };
    }

    lockInfo('⚒️ Forging integration secrets...');
    
    try {
      const forgingPrompt = `
        Forge complete Node.js integration secrets for: "${this.target}"
        
        Based on the picked security locks and unlocked pathways:
        Master Lock: ${state.masterLock?.name}
        Picked Locks: ${state.lockchain?.locks?.filter(l => l.picked)?.length || 0}
        
        Requirements:
        1. Use fetch() for HTTP security calls
        2. Handle authentication (master keys/security headers)
        3. Extract dynamic security tokens from responses
        4. Include error handling for failed picks
        5. Make it modular and reusable
        6. Add proper JSDoc comments with locksmith terminology
        
        Lock variables: ${JSON.stringify(state.lockVariables)}
        
        Generate a complete, working security integration module.
      `;
      
      const response = await this.masterKey.invoke([{ role: 'user', content: forgingPrompt }]);
      
      // Save forged secrets to file
      const secretsFilePath = './forged-integration-secrets.js';
      await fs.writeFile(secretsFilePath, response.content);
      
      lockSuccess(`✅ Secrets forged and saved to: ${secretsFilePath}`);
      
      return {
        ...state,
        forgedSecrets: response.content,
        secretsFilePath: secretsFilePath,
        step: 'secrets_forged'
      };
    } catch (error) {
      lockError(`Failed to forge secrets: ${error.message}`);
      throw error;
    }
  }

  async completeOperation(state) {
    lockInfo('🏁 Completing lockpicking operation...');
    
    const operationSummary = {
      target: this.target,
      vaultFile: this.vaultFilePath,
      securityLayersAnalyzed: state.vaultRequests?.length || 0,
      locksPicked: state.lockchain?.locks?.filter(l => l.picked)?.length || 0,
      masterLock: state.masterLock?.name || 'Not found',
      secretsForged: !!state.forgedSecrets,
      secretsFilePath: state.secretsFilePath
    };
    
    lockSuccess('📋 Operation Summary:');
    console.log(JSON.stringify(operationSummary, null, 2));
    
    return {
      ...state,
      operationSummary: operationSummary,
      step: 'operation_complete'
    };
  }

  shouldPickLock(state) {
    if (state.pendingLocks && state.pendingLocks.length > 0) {
      return "pick_lock";
    }
    
    if (this.shouldForgeCode && !state.forgedSecrets) {
      return "forge_secrets";
    }
    
    return "complete_operation";
  }

  shouldCompleteOperation(state) {
    if (state.pendingLocks && state.pendingLocks.length > 0) {
      return "pick_lock";
    }
    
    return "complete_operation";
  }
}
