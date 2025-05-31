import { StateGraph } from '@langchain/langgraph';
import { MasterLocksmith } from './agent.js';
import { LocksmithState } from './models/locksmith-state.js';
import { lockInfo, lockSuccess } from './util/lock-console.js';

export async function forgeLockchain(target, vaultFilePath, keysPath, shouldForgeCode) {
  lockInfo('🏗️ Forging lockchain architecture...');
  
  const masterLocksmith = new MasterLocksmith(target, vaultFilePath, keysPath, shouldForgeCode);
  
  // Define the lockchain state graph
  const lockchain = new StateGraph(LocksmithState);
  
  // Add locksmith nodes
  lockchain.addNode("analyze_vault", masterLocksmith.analyzeVault.bind(masterLocksmith));
  lockchain.addNode("forge_lockchain", masterLocksmith.forgeLockchain.bind(masterLocksmith));
  lockchain.addNode("pick_lock", masterLocksmith.pickLock.bind(masterLocksmith));
  lockchain.addNode("forge_secrets", masterLocksmith.forgeSecrets.bind(masterLocksmith));
  lockchain.addNode("complete_operation", masterLocksmith.completeOperation.bind(masterLocksmith));
  
  // Set entry point
  lockchain.setEntryPoint("analyze_vault");
  
  // Add lockchain edges
  lockchain.addEdge("analyze_vault", "forge_lockchain");
  lockchain.addConditionalEdges(
    "forge_lockchain",
    masterLocksmith.shouldPickLock.bind(masterLocksmith),
    {
      "pick_lock": "pick_lock",
      "forge_secrets": "forge_secrets",
      "complete_operation": "complete_operation"
    }
  );
  lockchain.addConditionalEdges(
    "pick_lock",
    masterLocksmith.shouldPickLock.bind(masterLocksmith),
    {
      "pick_lock": "pick_lock",
      "forge_secrets": "forge_secrets", 
      "complete_operation": "complete_operation"
    }
  );
  lockchain.addConditionalEdges(
    "forge_secrets",
    masterLocksmith.shouldCompleteOperation.bind(masterLocksmith),
    {
      "complete_operation": "complete_operation",
      "pick_lock": "pick_lock"
    }
  );
  lockchain.addEdge("complete_operation", "__end__");
  
  // Compile the lockchain
  const compiledLockchain = lockchain.compile();
  
  lockSuccess('✅ Lockchain architecture forged successfully');
  
  return {
    lockchain: compiledLockchain,
    locksmithInstance: masterLocksmith
  };
}

export { MasterLocksmith };
