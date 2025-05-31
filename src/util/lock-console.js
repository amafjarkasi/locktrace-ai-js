import chalk from 'chalk';

/**
 * Print locksmith info message with blue color
 * @param {string} message - Message to print
 */
export function lockInfo(message) {
  console.log(chalk.blue(`🔍 ${message}`));
}

/**
 * Print locksmith success message with green color
 * @param {string} message - Message to print
 */
export function lockSuccess(message) {
  console.log(chalk.green(`🔓 ${message}`));
}

/**
 * Print locksmith error message with red color
 * @param {string} message - Message to print
 */
export function lockError(message) {
  console.log(chalk.red(`🔒 ${message}`));
}

/**
 * Print locksmith warning message with yellow color
 * @param {string} message - Message to print
 */
export function lockWarning(message) {
  console.log(chalk.yellow(`⚠️ ${message}`));
}

/**
 * Print locksmith trace message with gray color (only in debug mode)
 * @param {string} message - Message to print
 */
export function lockTrace(message) {
  if (process.env.DEBUG === 'true') {
    console.log(chalk.gray(`🔎 ${message}`));
  }
}

/**
 * Print a locksmith separator line
 */
export function lockSeparator() {
  console.log(chalk.gray('🗝️ ' + '─'.repeat(46) + ' 🗝️'));
}

/**
 * Print locksmith banner
 */
export function lockBanner() {
  console.log(chalk.cyan.bold(`
  ██╗      ██████╗  ██████╗██╗  ██╗████████╗██████╗  █████╗  ██████╗███████╗
  ██║     ██╔═══██╗██╔════╝██║ ██╔╝╚══██╔══╝██╔══██╗██╔══██╗██╔════╝██╔════╝
  ██║     ██║   ██║██║     █████╔╝    ██║   ██████╔╝███████║██║     █████╗  
  ██║     ██║   ██║██║     ██╔═██╗    ██║   ██╔══██╗██╔══██║██║     ██╔══╝  
  ███████╗╚██████╔╝╚██████╗██║  ██╗   ██║   ██║  ██║██║  ██║╚██████╗███████╗
  ╚══════╝ ╚═════╝  ╚═════╝╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝╚══════╝
                                                                             
              🗝️ Master Locksmith - Digital Security Integration Expert 🗝️
  `));
}

/**
 * Print locksmith operation status
 * @param {string} operation - Current operation
 * @param {string} status - Operation status
 */
export function lockStatus(operation, status) {
  const statusColor = status === 'success' ? 'green' : 
                     status === 'error' ? 'red' : 
                     status === 'warning' ? 'yellow' : 'blue';
  console.log(chalk[statusColor](`🔧 ${operation}: ${status}`));
}

/**
 * Print lock picking progress
 * @param {number} current - Current lock number
 * @param {number} total - Total locks to pick
 * @param {string} lockName - Name of current lock
 */
export function lockProgress(current, total, lockName) {
  const percentage = Math.round((current / total) * 100);
  const progressBar = '█'.repeat(Math.round(percentage / 5)) + '░'.repeat(20 - Math.round(percentage / 5));
  
  console.log(chalk.cyan(`🔓 Picking Lock [${current}/${total}] ${progressBar} ${percentage}%`));
  console.log(chalk.blue(`   Current Lock: ${lockName}`));
}

/**
 * Print vault analysis summary
 * @param {Object} summary - Analysis summary object
 */
export function lockVaultSummary(summary) {
  lockSeparator();
  console.log(chalk.cyan.bold('🗄️ VAULT ANALYSIS SUMMARY'));
  console.log(chalk.blue(`   Security Layers Found: ${summary.totalLocks || 0}`));
  console.log(chalk.blue(`   Authentication Required: ${summary.hasAuth ? 'Yes' : 'No'}`));
  console.log(chalk.blue(`   Average Difficulty: ${summary.avgDifficulty || 'Unknown'}/10`));
  console.log(chalk.blue(`   Master Lock Identified: ${summary.masterLock || 'Unknown'}`));
  lockSeparator();
}

/**
 * Print operation completion summary
 * @param {Object} summary - Operation summary object
 */
export function lockOperationSummary(summary) {
  lockSeparator();
  console.log(chalk.green.bold('🎉 LOCKPICKING OPERATION COMPLETE'));
  console.log(chalk.green(`   Target: ${summary.target || 'Unknown'}`));
  console.log(chalk.green(`   Locks Picked: ${summary.locksPicked || 0}/${summary.totalLocks || 0}`));
  console.log(chalk.green(`   Secrets Extracted: ${summary.secretsForged ? 'Yes' : 'No'}`));
  console.log(chalk.green(`   Operation Time: ${summary.duration || 'Unknown'}`));
  if (summary.secretsFilePath) {
    console.log(chalk.green(`   Secrets Saved To: ${summary.secretsFilePath}`));
  }
  lockSeparator();
}

/**
 * Display a SecurityLock object in a compact, colorful format
 * @param {Object} lock - SecurityLock object
 * @param {number} index - Index for display
 */
export function displaySecurityLock(lock, index) {
  const methodColor = lock.method === 'GET' ? 'green' : 
                     lock.method === 'POST' ? 'yellow' : 
                     lock.method === 'PUT' ? 'blue' : 'red';
  
  const statusIcon = lock.picked ? '🔓' : '🔒';
  const difficultyBar = '█'.repeat(lock.difficulty || 1) + '░'.repeat(10 - (lock.difficulty || 1));
    console.log(chalk.gray(`   ${(index + 1).toString().padStart(2)}.`) + 
              ` ${statusIcon} ` + 
              chalk[methodColor].bold(lock.method?.padEnd(4) || 'UNK ') + 
              chalk.cyan(lock.name || 'unnamed_lock') + 
              chalk.gray(` [${difficultyBar}]`));
  
  if (lock.url && lock.url.length > 60) {
    console.log(chalk.gray(`      ${lock.url.substring(0, 60)}...`));
  } else if (lock.url) {
    console.log(chalk.gray(`      ${lock.url}`));
  }
}

/**
 * Display an array of SecurityLock objects with smart truncation
 * @param {Array} locks - Array of SecurityLock objects
 * @param {string} title - Title for the display
 * @param {number} maxDisplay - Maximum items to display (default: 10)
 */
export function displaySecurityLocks(locks, title, maxDisplay = 10) {
  if (!locks || locks.length === 0) {
    console.log(chalk.yellow(`🔍 ${title}: No items found`));
    return;
  }

  lockSeparator();
  console.log(chalk.cyan.bold(`🔐 ${title.toUpperCase()} (${locks.length} total)`));
  
  const displayCount = Math.min(locks.length, maxDisplay);
  
  for (let i = 0; i < displayCount; i++) {
    displaySecurityLock(locks[i], i);
  }
  
  if (locks.length > maxDisplay) {
    const remaining = locks.length - maxDisplay;
    console.log(chalk.gray(`   ... and ${remaining} more security locks`));
    
    // Show summary stats for remaining items
    const remainingMethods = locks.slice(maxDisplay).reduce((acc, lock) => {
      acc[lock.method || 'UNKNOWN'] = (acc[lock.method || 'UNKNOWN'] || 0) + 1;
      return acc;
    }, {});
    
    const methodSummary = Object.entries(remainingMethods)
      .map(([method, count]) => `${method}:${count}`)
      .join(' ');
    
    console.log(chalk.gray(`   └─ Summary: ${methodSummary}`));
  }
  lockSeparator();
}

/**
 * Display operation summary with beautiful formatting
 * @param {Object} summary - Operation summary object
 */
export function displayOperationSummary(summary) {
  if (!summary || typeof summary !== 'object') {
    console.log(chalk.yellow('🔍 Operation Summary: No data available'));
    return;
  }

  lockSeparator();
  console.log(chalk.magenta.bold('📋 OPERATION SUMMARY'));
  
  if (summary.metadata) {
    console.log(chalk.blue.bold('   🏷️  Metadata:'));
    if (summary.metadata.target) console.log(chalk.blue(`      Target: ${summary.metadata.target}`));
    if (summary.metadata.timestamp) console.log(chalk.blue(`      Started: ${new Date(summary.metadata.timestamp).toLocaleString()}`));
    if (summary.metadata.duration) console.log(chalk.blue(`      Duration: ${summary.metadata.duration}ms`));
  }
  
  if (summary.analysis) {
    console.log(chalk.cyan.bold('   🔍 Analysis:'));
    if (summary.analysis.totalRequests) console.log(chalk.cyan(`      Requests Analyzed: ${summary.analysis.totalRequests}`));
    if (summary.analysis.securityLayersFound) console.log(chalk.cyan(`      Security Layers: ${summary.analysis.securityLayersFound}`));
    if (summary.analysis.masterLock) console.log(chalk.cyan(`      Master Lock: ${summary.analysis.masterLock}`));
  }
  
  if (summary.results) {
    console.log(chalk.green.bold('   ✅ Results:'));
    if (summary.results.locksPicked !== undefined) console.log(chalk.green(`      Locks Picked: ${summary.results.locksPicked}`));
    if (summary.results.secretsForged !== undefined) console.log(chalk.green(`      Secrets Forged: ${summary.results.secretsForged ? 'Yes' : 'No'}`));
    if (summary.results.reportGenerated !== undefined) console.log(chalk.green(`      Report Generated: ${summary.results.reportGenerated ? 'Yes' : 'No'}`));
  }
  
  lockSeparator();
}

/**
 * Display lockchain information with visual hierarchy
 * @param {Object} lockchain - Lockchain object
 */
export function displayLockchain(lockchain) {
  if (!lockchain || typeof lockchain !== 'object') {
    console.log(chalk.yellow('🔍 Lockchain: No data available'));
    return;
  }

  lockSeparator();
  console.log(chalk.magenta.bold('🔗 LOCKCHAIN ARCHITECTURE'));
    if (lockchain.locks && Array.isArray(lockchain.locks)) {
    const totalLocks = lockchain.locks.length;
    const pickedLocks = lockchain.locks.filter(lock => lock.picked).length;
    const progressPercent = totalLocks > 0 ? Math.round((pickedLocks / totalLocks) * 100) : 0;
    
    // Enhanced progress bar with color coding
    const progressBars = Math.round(progressPercent / 5); // 0-20 bars
    const emptyBars = 20 - progressBars;
    const progressBar = '█'.repeat(progressBars) + '░'.repeat(emptyBars);
    
    // Color-code based on progress percentage
    let progressColor = 'red';
    let progressIcon = '🔒';
    if (progressPercent >= 90) {
      progressColor = 'green';
      progressIcon = '🎉';
    } else if (progressPercent >= 75) {
      progressColor = 'yellow';
      progressIcon = '🔓';
    } else if (progressPercent >= 50) {
      progressColor = 'cyan';
      progressIcon = '🔓';
    } else if (progressPercent >= 25) {
      progressColor = 'blue';
      progressIcon = '🔐';
    }
    
    console.log(chalk.blue(`   🔐 Total Locks: ${totalLocks}`));
    console.log(chalk[progressColor](`   ${progressIcon} Picked: ${pickedLocks} [${progressBar}] ${progressPercent}%`));
    
    // Add completion status message
    if (progressPercent >= 90) {
      console.log(chalk.green.bold(`   ✨ NEARLY COMPLETE! Excellent progress!`));
    } else if (progressPercent >= 75) {
      console.log(chalk.yellow.bold(`   🚀 GREAT PROGRESS! Most locks picked!`));
    } else if (progressPercent >= 50) {
      console.log(chalk.cyan.bold(`   💪 GOOD PROGRESS! Halfway there!`));
    } else if (progressPercent > 0) {
      console.log(chalk.blue(`   🔧 IN PROGRESS... Keep going!`));
    }
    
    // Show lock distribution by method
    const methodCounts = lockchain.locks.reduce((acc, lock) => {
      acc[lock.method || 'UNKNOWN'] = (acc[lock.method || 'UNKNOWN'] || 0) + 1;
      return acc;
    }, {});
    
    console.log(chalk.cyan('   📊 Distribution:'));
    Object.entries(methodCounts).forEach(([method, count]) => {
      const methodColor = method === 'GET' ? 'green' : 
                         method === 'POST' ? 'yellow' : 
                         method === 'PUT' ? 'blue' : 'red';
      console.log(chalk.gray(`      `) + chalk[methodColor](method) + chalk.gray(`: ${count}`));
    });
  }
    if (lockchain.securityLinks && Array.isArray(lockchain.securityLinks)) {
    console.log(chalk.magenta(`   🔗 Security Links: ${lockchain.securityLinks.length}`));
  }
  
  lockSeparator();
}

/**
 * Smart object inspector that handles different data types beautifully
 * @param {any} obj - Object to inspect
 * @param {string} label - Label for the object
 * @param {number} maxDepth - Maximum depth to inspect (default: 2)
 */
export function lockInspect(obj, label, maxDepth = 2) {
  if (obj === null || obj === undefined) {
    console.log(chalk.gray(`🔍 ${label}: ${obj}`));
    return;
  }
  
  if (Array.isArray(obj)) {
    if (obj.length === 0) {
      console.log(chalk.yellow(`🔍 ${label}: Empty array []`));
      return;
    }
    
    // Check if it's an array of SecurityLock objects
    if (obj[0] && obj[0].constructor && obj[0].constructor.name === 'SecurityLock') {
      displaySecurityLocks(obj, label);
      return;
    }
    
    // For other arrays, show smart summary
    console.log(chalk.cyan(`🔍 ${label}: Array[${obj.length}]`));
    if (obj.length <= 5) {
      obj.forEach((item, index) => {
        console.log(chalk.gray(`   ${index}: ${typeof item === 'object' ? JSON.stringify(item).substring(0, 50) + '...' : item}`));
      });
    } else {
      obj.slice(0, 3).forEach((item, index) => {
        console.log(chalk.gray(`   ${index}: ${typeof item === 'object' ? JSON.stringify(item).substring(0, 50) + '...' : item}`));
      });
      console.log(chalk.gray(`   ... and ${obj.length - 3} more items`));
    }
    return;
  }
  
  if (typeof obj === 'object') {
    const keys = Object.keys(obj);
    console.log(chalk.cyan(`🔍 ${label}: Object{${keys.length} properties}`));
    
    keys.slice(0, 5).forEach(key => {
      const value = obj[key];
      if (Array.isArray(value)) {
        console.log(chalk.gray(`   ${key}: Array[${value.length}]`));
      } else if (typeof value === 'object' && value !== null) {
        console.log(chalk.gray(`   ${key}: Object{${Object.keys(value).length}}`));
      } else {
        const displayValue = typeof value === 'string' && value.length > 30 ? 
                           value.substring(0, 30) + '...' : value;
        console.log(chalk.gray(`   ${key}: ${displayValue}`));
      }
    });
    
    if (keys.length > 5) {
      console.log(chalk.gray(`   ... and ${keys.length - 5} more properties`));
    }
    return;
  }
  
  // For primitive types
  console.log(chalk.gray(`🔍 ${label}: ${obj}`));
}

// Backward compatibility exports
export const printInfo = lockInfo;
export const printSuccess = lockSuccess;
export const printError = lockError;
export const printWarning = lockWarning;
export const printDebug = lockTrace;
export const printSeparator = lockSeparator;
