import { MasterLocksmith } from './agent.js';
import { lockInfo, lockSuccess } from './util/lock-console.js';

export async function forgeLockchain(target, vaultFilePath, keysPath, shouldForgeCode) {
  lockInfo('🏗️ Forging lockchain architecture...');
  console.log('DEBUG: Creating MasterLocksmith with:', { target, vaultFilePath, keysPath, shouldForgeCode });
  
  const masterLocksmith = new MasterLocksmith(target, vaultFilePath, keysPath, shouldForgeCode);
  console.log('DEBUG: MasterLocksmith created successfully');
  
  // For now, create a simple mock lockchain that just executes the workflow sequentially
  // This bypasses the LangGraph StateGraph issues while we test the core functionality
  const mockLockchain = {
    stream: async function* (initialState, config) {
      console.log('DEBUG: Mock lockchain starting with state:', initialState);
      
      // Simulate the workflow steps
      let currentState = { ...initialState };
      
      // Step 1: Analyze vault
      console.log('DEBUG: Executing analyze_vault...');
      currentState = await masterLocksmith.analyzeVault(currentState);
      yield { analyze_vault: currentState };
      
      // Step 2: Forge lockchain  
      console.log('DEBUG: Executing forge_lockchain...');
      currentState = await masterLocksmith.forgeLockchain(currentState);
      yield { forge_lockchain: currentState };
      
      // Step 3: Complete operation
      console.log('DEBUG: Executing complete_operation...');
      currentState = await masterLocksmith.completeOperation(currentState);
      yield { complete_operation: currentState };
      
      console.log('DEBUG: Mock lockchain completed');
    }
  };
  
  lockSuccess('✅ Lockchain architecture forged successfully (using mock implementation)');
  
  return {
    lockchain: mockLockchain,
    locksmithInstance: masterLocksmith
  };
}

export { MasterLocksmith };
