import { chromium } from 'playwright';
import fs from 'fs-extra';
import { lockInfo, lockSuccess, lockError, lockWarning } from '../src/util/lock-console.js';

console.log('VAULT FORGER: Script loaded successfully!');

/**
 * Open browser and wait for user to complete security reconnaissance, then save vault and keys
 */
export async function openBrowserAndWait() {
  let browser;
  let context;
    try {
    lockInfo('🌐 Launching security reconnaissance browser...');
    console.log('DEBUG: About to launch chromium browser...');
    
    browser = await chromium.launch({ 
      headless: false,
      devtools: true, // Open DevTools for user to analyze security layers
      slowMo: 1000 // Add delay to see what's happening
    });
      console.log('DEBUG: Browser launched successfully!');
    
    lockInfo('🗄️ Setting up digital vault recording...');
    console.log('DEBUG: Creating browser context...');
    
    context = await browser.newContext({
      recordHar: {
        path: "./network_requests.har",
        content: "embed"
      }
    });

    console.log('DEBUG: Context created, opening new page...');
    const page = await context.newPage();
    console.log('DEBUG: Page created, navigating to about:blank...');
    
    // Navigate to a blank page initially
    await page.goto('about:blank');
    console.log('DEBUG: Navigation complete!');
    
    lockSuccess('✅ Security reconnaissance browser is ready!');
    lockInfo('');
    lockInfo('🎯 Master Locksmith Instructions:');
    lockInfo('1. Navigate to the target security system you want to analyze');
    lockInfo('2. Perform the authentication and access patterns you want to replicate');
    lockInfo('3. Complete the full security workflow you want to unlock');
    lockInfo('4. When reconnaissance is complete, return to this terminal and press Enter');
    lockInfo('');
    lockWarning('⚠️  Keep the browser open until you press Enter to forge the vault!');
    lockInfo('');
    
    // Wait for user input
    await new Promise((resolve) => {
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.once('data', () => {
        process.stdin.setRawMode(false);
        process.stdin.pause();
        resolve();
      });
    });    lockInfo('� Forging digital vault from reconnaissance data...');
    
    // Save master keys (cookies)
    const masterKeys = await context.cookies();
    await fs.writeJSON('cookies.json', masterKeys, { spaces: 2 });
    
    lockSuccess(`✅ Forged ${masterKeys.length} master keys to cookies.json`);

    lockInfo('🛑 Closing reconnaissance browser and finalizing vault...');
    
    await context.close();
    await browser.close();
    
    // Verify vault file was created
    if (await fs.pathExists('./network_requests.har')) {
      const vaultData = await fs.readJSON('./network_requests.har');
      const securityLayersCount = vaultData.log?.entries?.length || 0;
      lockSuccess(`✅ Digital vault forged with ${securityLayersCount} security layers`);
      
      if (securityLayersCount === 0) {
        lockWarning('⚠️  No security layers were recorded. Make sure you performed authentication and access actions in the browser.');
      } else {
        lockInfo('');
        lockSuccess('🎉 Vault forging complete! You can now run:');
        lockInfo('   locktrace --target "Your security objective" --generate-code');
      }    } else {
      lockError('❌ Digital vault was not forged');
    }
    
  } catch (error) {
    lockError(`Failed to forge digital vault: ${error.message}`);
    
    // Clean up on error
    if (context) {
      try {
        await context.close();
      } catch {}
    }
    if (browser) {
      try {
        await browser.close();
      } catch {}
    }
    
    throw error;
  }
}

/**
 * Validate existing digital vault file
 * @param {string} vaultPath - Path to vault file
 * @returns {Promise<Object>} Validation result
 */
export async function validateVaultFile(vaultPath = './network_requests.har') {
  try {
    if (!await fs.pathExists(vaultPath)) {
      return {        valid: false,
        error: 'Digital vault file does not exist',
        securityLayersCount: 0
      };
    }
    
    const vaultData = await fs.readJSON(vaultPath);
    
    if (!vaultData.log || !vaultData.log.entries) {
      return {
        valid: false,
        error: 'Invalid vault file format',
        securityLayersCount: 0
      };
    }
    
    const securityLayersCount = vaultData.log.entries.length;
    
    return {
      valid: true,
      securityLayersCount: securityLayersCount,
      hasSecurityLayers: securityLayersCount > 0
    };
  } catch (error) {
    return {
      valid: false,
      error: error.message,
      securityLayersCount: 0
    };
  }
}

/**
 * Forge digital vault with custom options
 * @param {Object} options - Browser and recording options
 */
export async function forgeVaultWithOptions(options = {}) {
  const {
    headless = false,
    devtools = true,
    vaultPath = './network_requests.har',
    masterKeysPath = './cookies.json',
    initialUrl = 'about:blank',
    timeout = 300000 // 5 minutes default timeout
  } = options;
  
  let browser;
  let context;
  
  try {
    browser = await chromium.launch({ headless, devtools });
    
    context = await browser.newContext({
      recordHar: {
        path: vaultPath,
        content: "embed"
      }
    });

    const page = await context.newPage();
    await page.goto(initialUrl);
    
    lockSuccess('✅ Security browser ready with custom reconnaissance options');
    lockInfo(`�️ Digital vault will be forged to: ${vaultPath}`);
    lockInfo(`🗝️ Master keys will be saved to: ${masterKeysPath}`);
      // Set up timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Security reconnaissance timeout after ${timeout / 1000} seconds`));
      }, timeout);
    });
    
    // Wait for user input or reconnaissance timeout
    const userInputPromise = new Promise((resolve) => {
      process.stdin.once('data', resolve);
    });
    
    await Promise.race([userInputPromise, timeoutPromise]);
    
    // Save master keys and close
    const masterKeys = await context.cookies();
    await fs.writeJSON(masterKeysPath, masterKeys, { spaces: 2 });
    
    await context.close();
    await browser.close();
    
    const validation = await validateVaultFile(vaultPath);
    
    if (validation.valid) {
      lockSuccess(`✅ Successfully forged digital vault with ${validation.securityLayersCount} security layers`);
    } else {
      lockError(`❌ Digital vault validation failed: ${validation.error}`);
    }
    
    return validation;
    
  } catch (error) {
    if (context) await context.close().catch(() => {});
    if (browser) await browser.close().catch(() => {});
    throw error;
  }
}

// Always run the function for testing
console.log('VAULT FORGER: Starting execution...');
openBrowserAndWait().catch(error => {
  lockError(`Vault forging error: ${error.message}`);
  console.error('DEBUG: Full error:', error);
  process.exit(1);
});
