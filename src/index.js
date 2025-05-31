#!/usr/bin/env node

import { config } from 'dotenv';
import { Command } from 'commander';
import { unlockSecrets } from './locksmith.js';
import chalk from 'chalk';

config(); // Load environment variables

const program = new Command();

program
  .name('locktrace')
  .description('🗝️ Master locksmith that picks API locks and traces digital secrets to craft perfect integrations')
  .version('1.0.0');

program
  .option('-k, --key-model <model>', 'The AI key to use for unlocking', 'gpt-4o')
  .requiredOption('-t, --target <target>', 'The target to unlock and trace')
  .option('--vault-path <path>', 'The vault file path (HAR)', './digital_vault.har')
  .option('--keys-path <path>', 'The master keys file path (cookies)', './master_keys.json')
  .option('--max-picks <number>', 'Maximum lock picking attempts', '20')
  .option('--variables <variables...>', 'Lock variables in the format key=value')
  .option('--forge-code', 'Forge the complete integration code', false)
  .action(async (options) => {
    try {
      console.log(chalk.blue('�️ LockTrace Master Locksmith starting...'));
      
      // Parse lock variables from key=value format
      const lockVars = {};
      if (options.variables) {
        options.variables.forEach(variable => {
          const [key, value] = variable.split('=');
          if (key && value) {
            lockVars[key] = value;
          }
        });
      }

      await unlockSecrets(
        options.keyModel,
        options.target,
        options.vaultPath,
        options.keysPath,
        lockVars,
        parseInt(options.maxPicks),
        options.forgeCode
      );
    } catch (error) {
      console.error(chalk.red('🔒 Unlocking failed:'), error.message);
      process.exit(1);
    }
  });

// Add a command to forge vault files
program
  .command('forge-vault')
  .description('🔨 Forge a new digital vault by recording browser interactions')
  .action(async () => {
    try {
      const { forgeVault } = await import('../scripts/vault-forger.js');
      await forgeVault();
    } catch (error) {
      console.error(chalk.red('🔥 Vault forging failed:'), error.message);
      process.exit(1);
    }
  });

program.parse();
