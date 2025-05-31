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
      console.log('DEBUG: Reading vault file:', this.vaultFilePath);
      const vaultData = await fs.readJSON(this.vaultFilePath);
      console.log('DEBUG: Vault data loaded, keys:', Object.keys(vaultData));
      
      const lockRequests = await processVaultFile(vaultData);
      console.log('DEBUG: Lock requests processed:', lockRequests.length);
      
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
      const response = await this.masterKey.invoke(securityAnalysisPrompt);
      
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
    
    try {
      // Generate comprehensive operation report
      const timestamp = new Date().toISOString();
      const reportData = {
        metadata: {
          timestamp: timestamp,
          target: this.target,
          vaultFile: this.vaultFilePath,
          keysFile: this.keysPath,
          codeGenerated: this.shouldForgeCode
        },
        analysis: {
          totalRequests: state.vaultRequests?.length || 0,
          securityLayersFound: state.vaultRequests?.filter(r => r.method === 'POST' || r.url.includes('auth') || r.url.includes('login')).length || 0,
          masterLock: state.masterLock || { name: 'Not identified', method: 'Unknown', url: 'Unknown' },
          criticalEndpoints: state.vaultRequests?.filter(r => 
            r.method === 'POST' || 
            r.url.includes('auth') || 
            r.url.includes('login') || 
            r.url.includes('sign') ||
            r.url.includes('session')
          ).slice(0, 10).map(r => ({
            method: r.method,
            url: r.url,
            status: r.status
          })) || [],
          securityAnalysis: state.securityAnalysis
        },
        results: {
          locksPicked: state.lockchain?.locks?.filter(l => l.picked)?.length || 0,
          secretsForged: !!state.forgedSecrets,
          secretsFilePath: state.secretsFilePath,
          operationSuccess: true
        }
      };

      // Save detailed report to file
      const reportFilename = `locktrace_report_${timestamp.replace(/[:.]/g, '-')}.json`;
      await fs.writeJSON(reportFilename, reportData, { spaces: 2 });
      
      // Generate human-readable summary
      const summaryFilename = `locktrace_summary_${timestamp.replace(/[:.]/g, '-')}.md`;
      const summaryContent = this.generateMarkdownSummary(reportData);
      await fs.writeFile(summaryFilename, summaryContent);
      
      lockSuccess('📋 🎉 LOCKTRACE OPERATION COMPLETE! 🎉');
      lockInfo('');
      lockSuccess('📊 SECURITY ANALYSIS SUMMARY:');
      lockInfo(`🎯 Target: ${this.target}`);
      lockInfo(`🔍 Analyzed ${reportData.analysis.totalRequests} network requests`);
      lockInfo(`🛡️ Found ${reportData.analysis.securityLayersFound} security-related endpoints`);
      
      if (state.masterLock) {
        lockSuccess(`🏆 Master Lock Identified: ${state.masterLock.name}`);
        lockInfo(`   Method: ${state.masterLock.method}`);
        lockInfo(`   URL: ${state.masterLock.url}`);
      }
      
      lockInfo('');
      lockSuccess('🔍 CRITICAL ENDPOINTS DISCOVERED:');
      reportData.analysis.criticalEndpoints.forEach((endpoint, i) => {
        lockInfo(`   ${i + 1}. ${endpoint.method} ${endpoint.url} (${endpoint.status})`);
      });
      
      lockInfo('');
      lockSuccess(`📄 Reports Generated:`);
      lockInfo(`   📋 Detailed: ${reportFilename}`);
      lockInfo(`   📝 Summary: ${summaryFilename}`);
      
      if (this.shouldForgeCode && state.forgedSecrets) {
        lockInfo(`   💎 Secrets: ${state.secretsFilePath}`);
      }
      
      lockInfo('');
      lockSuccess('🚀 Ready for integration! Use the generated reports to build your API client.');
      
      return {
        ...state,
        operationSummary: reportData,
        reportFile: reportFilename,
        summaryFile: summaryFilename,
        step: 'operation_complete'
      };
      
    } catch (error) {
      lockError(`Failed to complete operation: ${error.message}`);
      throw error;
    }
  }

  generateMarkdownSummary(reportData) {
    return `# 🗝️ LockTrace Security Analysis Report

## 📋 Operation Summary
- **Target**: ${reportData.metadata.target}
- **Timestamp**: ${reportData.metadata.timestamp}
- **Vault File**: ${reportData.metadata.vaultFile}
- **Code Generation**: ${reportData.metadata.codeGenerated ? '✅ Enabled' : '❌ Disabled'}

## 🔍 Security Analysis Results
- **Total Requests Analyzed**: ${reportData.analysis.totalRequests}
- **Security Endpoints Found**: ${reportData.analysis.securityLayersFound}
- **Operation Status**: ${reportData.results.operationSuccess ? '✅ Success' : '❌ Failed'}

## 🏆 Master Lock Discovery
${reportData.analysis.masterLock.name !== 'Not identified' ? `
- **Lock Name**: ${reportData.analysis.masterLock.name}
- **Method**: ${reportData.analysis.masterLock.method}
- **URL**: ${reportData.analysis.masterLock.url}
` : '- **Status**: No master lock identified'}

## 🛡️ Critical Security Endpoints
${reportData.analysis.criticalEndpoints.map((endpoint, i) => 
  `${i + 1}. **${endpoint.method}** \`${endpoint.url}\` (Status: ${endpoint.status})`
).join('\n')}

## 🧠 AI Security Analysis
\`\`\`
${reportData.analysis.securityAnalysis || 'No detailed analysis available'}
\`\`\`

## 📊 Results Summary
- **Locks Picked**: ${reportData.results.locksPicked}
- **Secrets Forged**: ${reportData.results.secretsForged ? 'Yes' : 'No'}
${reportData.results.secretsFilePath ? `- **Secrets File**: ${reportData.results.secretsFilePath}` : ''}

---
*Generated by LockTrace AI Locksmith 🗝️*
`;
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
