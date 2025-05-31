import { forgeLockchain } from './lockchain-forger.js';
import { MasterKey } from './util/master-key.js';
import { lockTrace, lockSuccess, lockError, lockInfo, lockInspect, displayOperationSummary, displayLockchain, displaySecurityLocks } from './util/lock-console.js';
import fs from 'fs-extra';

let masterLocksmith = null;

export async function unlockSecrets(
  keyModel,
  target,
  vaultPath,
  keysPath,
  lockVariables = {},
  maxPicks = 15,
  shouldForgeCode = false
) {
  try {
    // Validate vault exists
    if (!await fs.pathExists(vaultPath)) {
      throw new Error(`Digital vault not found: ${vaultPath}. Please run 'locktrace forge-vault' first.`);
    }    lockInfo(`🔑 Initializing Master Key with model: ${keyModel}`);
    MasterKey.setDefaultModel(keyModel);
    const masterKey = MasterKey.getInstance();    lockInfo(`🏗️ Forging lockchain architecture...`);
    console.log('DEBUG: About to forge lockchain...');
    const { lockchain, locksmithInstance } = await forgeLockchain(target, vaultPath, keysPath, shouldForgeCode);
    console.log('DEBUG: Lockchain forged successfully');
    masterLocksmith = locksmithInstance;

    const initialState = {
      masterLock: null,
      currentPick: null,
      pendingLocks: [],
      pickedSecrets: [],
      targetUrl: "",
      lockVariables: lockVariables || {},
      target: target,
      vaultPath: vaultPath,
      keysPath: keysPath,
      shouldForgeCode: shouldForgeCode
    };

    const config = {
      recursionLimit: maxPicks
    };

    lockInfo(`🎯 Beginning lockpicking operation: "${target}"`);
    lockInfo(`🗄️ Using vault: ${vaultPath}`);    lockInfo(`🗝️ Using master keys: ${keysPath}`);
    lockInfo(`🔢 Maximum picks: ${maxPicks}`);
    lockInfo(`⚒️ Forge code: ${shouldForgeCode}`);

    lockTrace('🎯 Initializing lockpicking operation...');
    lockTrace(`📁 Using state: ${Object.keys(initialState).join(', ')}`);
    lockTrace('🚀 Starting lockchain stream...');
    
    const eventStream = lockchain.stream(initialState, config);
    lockTrace('✨ Event stream processing started...');
    let finalState = null;
    
    for await (const event of eventStream) {
      // Use smart object inspection instead of raw logging
      lockTrace('🔄 Processing lockchain event...');
      
      const eventKeys = Object.keys(event || {});
      if (eventKeys.length > 0) {
        lockTrace(`🔄 Event type: ${eventKeys.join(', ')}`);
        
        // Display event contents with beautiful formatting
        for (const [key, value] of Object.entries(event)) {
          if (value && typeof value === 'object') {
            // Special handling for different types of data
            if (value.vaultRequests) {
              displaySecurityLocks(value.vaultRequests, 'Vault Requests', 5);
            }
            if (value.pendingLocks) {
              displaySecurityLocks(value.pendingLocks, 'Pending Locks', 5);
            }
            if (value.lockchain) {
              displayLockchain(value.lockchain);
            }
            if (value.operationSummary) {
              displayOperationSummary(value.operationSummary);
            }
            
            // Standard info logging for key events
            if (value.masterLock) {
              lockInfo(`🏆 Master lock identified: ${value.masterLock?.name || 'Unknown'}`);
            }
            if (value.currentPick) {
              lockInfo(`🔓 Picking lock: ${value.currentPick?.name || 'Unknown'}`);
            }
            
            // Capture the final state for reporting
            finalState = value;
          }
        }
      }
    }

    // Generate comprehensive reports using the master locksmith
    if (masterLocksmith && finalState) {
      lockInfo('📋 Generating comprehensive security analysis reports...');
      try {
        const completedState = await masterLocksmith.completeOperation(finalState);
        lockSuccess('📊 Security analysis reports generated successfully!');
      } catch (reportError) {
        lockError(`Report generation failed: ${reportError.message}`);
        // Continue execution even if reporting fails
      }
    } else {
      lockSuccess('🎉 All locks successfully picked! Secrets unlocked!');
      lockInfo('⚠️ No master locksmith available for detailed reporting');
    }
    
  } catch (error) {
    lockError(`Lock picking failed: ${error.message}`);
    throw error;
  }
}

export function getMasterLocksmith() {
  return masterLocksmith;
}
