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

// Backward compatibility exports
export const printInfo = lockInfo;
export const printSuccess = lockSuccess;
export const printError = lockError;
export const printWarning = lockWarning;
export const printDebug = lockTrace;
export const printSeparator = lockSeparator;
