import { forgeLockchain } from './lockchain-forger.js';
import { MasterKey } from './util/master-key.js';
import { lockTrace, lockSuccess, lockError, lockInfo } from './util/lock-console.js';
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
    const masterKey = MasterKey.getInstance();

    lockInfo(`🏗️ Forging lockchain architecture...`);
    const { lockchain, locksmithInstance } = await forgeLockchain(target, vaultPath, keysPath, shouldForgeCode);
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
    lockInfo(`🗄️ Using vault: ${vaultPath}`);
    lockInfo(`🗝️ Using master keys: ${keysPath}`);
    lockInfo(`🔢 Maximum picks: ${maxPicks}`);
    lockInfo(`⚒️ Forge code: ${shouldForgeCode}`);

    const eventStream = lockchain.stream(initialState, config);
    
    for await (const event of eventStream) {
      const eventKeys = Object.keys(event);
      if (eventKeys.length > 0) {
        lockTrace(`🔄 Processing lock event: ${eventKeys.join(', ')}`);
        
        // Log state changes for debugging
        for (const [key, value] of Object.entries(event)) {
          if (value && typeof value === 'object' && value.masterLock) {
            lockInfo(`🏆 Master lock identified: ${value.masterLock?.name || 'Unknown'}`);
          }
          if (value && typeof value === 'object' && value.currentPick) {
            lockInfo(`🔓 Picking lock: ${value.currentPick?.name || 'Unknown'}`);
          }
        }
      }
    }

    lockSuccess('🎉 All locks successfully picked! Secrets unlocked!');
    
  } catch (error) {
    lockError(`Lock picking failed: ${error.message}`);
    throw error;
  }
}

export function getMasterLocksmith() {
  return masterLocksmith;
}
