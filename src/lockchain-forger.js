import { MasterLocksmith } from './agent.js';
import { lockInfo, lockSuccess, lockInspect, displayOperationSummary, displayLockchain, displaySecurityLocks } from './util/lock-console.js';

export async function forgeLockchain(target, vaultFilePath, keysPath, shouldForgeCode) {
  lockInfo('🏗️ Forging lockchain architecture...');
  console.log('DEBUG: Creating MasterLocksmith with:', { target, vaultFilePath, keysPath, shouldForgeCode });
  
  const masterLocksmith = new MasterLocksmith(target, vaultFilePath, keysPath, shouldForgeCode);
  console.log('DEBUG: MasterLocksmith created successfully');
    // For now, create a simple mock lockchain that just executes the workflow sequentially
  // This bypasses the LangGraph StateGraph issues while we test the core functionality
  const mockLockchain = {
    stream: async function* (initialState, config) {
      console.log('DEBUG: Mock lockchain starting with state summary:', {
        vaultRequestsCount: initialState.vaultRequests?.length || 0,
        pendingLocksCount: initialState.pendingLocks?.length || 0,
        hasLockchain: !!initialState.lockchain,
        hasSecurityAnalysis: !!initialState.securityAnalysis,
        hasPickedLocks: !!initialState.pickedLocks,
        hasForgedSecrets: !!initialState.forgedSecrets
      });
      
      // Simulate the workflow steps
      let currentState = { ...initialState };
        // Step 1: Analyze vault
      console.log('DEBUG: Executing analyze_vault...');
      currentState = await masterLocksmith.analyzeVault(currentState);
      console.log(`DEBUG: Vault analysis complete - Found ${currentState.vaultRequests?.length || 0} security locks`);
      yield { analyze_vault: currentState };
        // Step 2: Forge lockchain  
      console.log('DEBUG: Executing forge_lockchain...');
      currentState = await masterLocksmith.forgeLockchain(currentState);
      console.log(`DEBUG: Lockchain forged - ${currentState.pendingLocks?.length || 0} locks pending, master lock: ${currentState.lockchain?.masterLock || 'unknown'}`);
      yield { forge_lockchain: currentState };      // Step 3: Pick locks (ultra-efficient batch processing)
      if (currentState.pendingLocks && currentState.pendingLocks.length > 0) {
        // Pick a realistic percentage of locks (85% completion rate)
        const completionRate = 0.85;
        const maxPicks = Math.floor(currentState.pendingLocks.length * completionRate);
        console.log(`DEBUG: Executing ultra-fast batch lock picking for ${maxPicks} locks (${Math.round(completionRate * 100)}% completion target)...`);
        
        // Ultra-efficient batch processing - process locks in large chunks
        const batchSize = Math.min(25, Math.max(10, Math.floor(maxPicks / 4))); // Only 4 progress updates max
        const batches = Math.ceil(maxPicks / batchSize);
        
        for (let batch = 0; batch < batches; batch++) {
          const startIdx = batch * batchSize;
          const endIdx = Math.min(startIdx + batchSize, maxPicks);
          const locksInBatch = endIdx - startIdx;
          
          // Process entire batch at once (ultra-fast)
          currentState = await masterLocksmith.pickLockBatch(currentState, locksInBatch);
          
          const totalPicked = endIdx;
          const progressPercent = Math.round((totalPicked / maxPicks) * 100);
          console.log(`DEBUG: Batch ${batch + 1}/${batches} complete - ${totalPicked}/${maxPicks} locks picked (${progressPercent}% of target)`);
          
          yield { pick_lock: currentState };
          
          // Minimal delay to show progress without slowing down
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }
      
      // Step 4: Forge secrets (if enabled)
      if (masterLocksmith.shouldForgeCode) {
        console.log('DEBUG: Executing forge_secrets...');
        currentState = await masterLocksmith.forgeSecrets(currentState);
        console.log(`DEBUG: Secrets forged - Generated ${currentState.forgedSecrets ? 'integration code' : 'no code'}`);
        yield { forge_secrets: currentState };
      }
      
      // Step 5: Complete operation
      console.log('DEBUG: Executing complete_operation...');
      currentState = await masterLocksmith.completeOperation(currentState);
      console.log('DEBUG: Operation completed - Reports generated');
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
