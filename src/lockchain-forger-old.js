import { StateGraph } from '@langchain/langgraph';
import { MasterLocksmith } from './agent.js';
import { lockInfo, lockSuccess } from './util/lock-console.js';

// Define state schema as plain object for LangGraph
const locksmithStateSchema = {
  masterLock: null,
  currentPick: null,
  pendingLocks: [],
  pickedSecrets: [],
  targetUrl: "",
  lockVariables: {},
  target: "",
  vaultFilePath: "",
  keysPath: "",
  shouldForgeCode: false,
  vaultRequests: [],
  securityAnalysis: null,
  lockchain: null,
  forgedSecrets: null,
  secretsFilePath: null,
  operationSummary: null,
  step: "initialized",
};

export async function forgeLockchain(target, vaultFilePath, keysPath, shouldForgeCode) {
  lockInfo('🏗️ Forging lockchain architecture...');
  console.log('DEBUG: Creating MasterLocksmith with:', { target, vaultFilePath, keysPath, shouldForgeCode });
  
  const masterLocksmith = new MasterLocksmith(target, vaultFilePath, keysPath, shouldForgeCode);
  console.log('DEBUG: MasterLocksmith created successfully');  // Define the lockchain state graph
  console.log('DEBUG: Creating StateGraph...');
  const lockchain = new StateGraph();
  console.log('DEBUG: StateGraph created');
  
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
  console.log('DEBUG: About to compile lockchain...');
  const compiledLockchain = lockchain.compile();
  console.log('DEBUG: Lockchain compiled successfully');
  
  lockSuccess('✅ Lockchain architecture forged successfully');
  
  return {
    lockchain: compiledLockchain,
    locksmithInstance: masterLocksmith
  };
}

export { MasterLocksmith };
