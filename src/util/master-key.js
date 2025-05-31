import { ChatOpenAI } from '@langchain/openai';
import { lockInfo, lockError } from './lock-console.js';

/**
 * Singleton class for managing Master Key (LLM) instances used for lockpicking
 */
class MasterKey {
  static instance = null;
  static defaultModel = "gpt-4o";
  static alternateModel = "gpt-4o-mini";

  /**
   * Get Master Key instance
   * @param {string} model - Model name to use for the master key
   * @returns {ChatOpenAI} Master Key instance
   */
  static getInstance(model = null) {
    if (model === null) {
      model = this.defaultModel;
    }
    
    if (this.instance === null || this.instance.modelName !== model) {
      lockInfo(`🔑 Forging Master Key with model: ${model}`);
      
      this.instance = new ChatOpenAI({
        modelName: model,
        temperature: 0.1, // Lower temperature for more precise lockpicking
        maxTokens: 4000,
        openAIApiKey: process.env.OPENAI_API_KEY
      });
    }
    return this.instance;
  }

  /**
   * Set default master key model
   * @param {string} model - Model name
   */
  static setDefaultModel(model) {
    lockInfo(`🔧 Setting default Master Key to: ${model}`);
    this.defaultModel = model;
  }

  /**
   * Get current master key model
   * @returns {string} Current model name
   */
  static getCurrentModel() {
    return this.instance ? this.instance.modelName : this.defaultModel;
  }

  /**
   * Use alternate master key model
   */
  static useAlternateModel() {
    lockInfo(`🔄 Switching to alternate Master Key: ${this.alternateModel}`);
    this.instance = this.getInstance(this.alternateModel);
  }

  /**
   * Reset master key to default
   */
  static resetToDefault() {
    lockInfo(`🔄 Resetting Master Key to default: ${this.defaultModel}`);
    this.instance = this.getInstance(this.defaultModel);
  }

  /**
   * Invoke master key for lockpicking with retry logic
   * @param {Array} messages - Messages for the master key
   * @param {number} maxRetries - Maximum number of retry attempts
   * @returns {Promise<Object>} Master key response
   */
  static async invoke(messages, maxRetries = 3) {
    const masterKey = this.getInstance();
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        lockInfo(`🔓 Attempting to pick lock with Master Key (attempt ${attempt}/${maxRetries})`);
        const response = await masterKey.invoke(messages);
        lockInfo(`✅ Lock successfully picked with Master Key`);
        return response;
      } catch (error) {
        lockError(`❌ Lock picking attempt ${attempt} failed: ${error.message}`);
        
        if (attempt === maxRetries) {
          lockError(`🚫 All lock picking attempts exhausted. Lock remains secure.`);
          throw error;
        }
        
        // Wait before retry (exponential backoff)
        const waitTime = Math.pow(2, attempt) * 1000;
        lockInfo(`⏳ Waiting ${waitTime/1000}s before next picking attempt...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        
        // Try alternate model on second attempt
        if (attempt === 2) {
          this.useAlternateModel();
        }
      }
    }
  }

  /**
   * Batch invoke master key for multiple locks
   * @param {Array} messageArrays - Array of message arrays
   * @returns {Promise<Array>} Array of responses
   */
  static async batchInvoke(messageArrays) {
    lockInfo(`🔓 Picking multiple locks with Master Key (${messageArrays.length} locks)`);
    const masterKey = this.getInstance();
    
    try {
      const responses = await Promise.all(
        messageArrays.map(messages => masterKey.invoke(messages))
      );
      lockInfo(`✅ Successfully picked ${responses.length} locks with Master Key`);
      return responses;
    } catch (error) {
      lockError(`❌ Batch lock picking failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Check if master key is available
   * @returns {boolean} True if master key is configured
   */
  static isAvailable() {
    return !!process.env.OPENAI_API_KEY;
  }

  /**
   * Get master key capabilities
   * @returns {Object} Capabilities object
   */
  static getCapabilities() {
    const masterKey = this.getInstance();
    return {
      model: masterKey.modelName,
      maxTokens: masterKey.maxTokens,
      temperature: masterKey.temperature,
      hasApiKey: this.isAvailable(),
      canPickLocks: this.isAvailable()
    };
  }

  /**
   * Validate master key configuration
   * @throws {Error} If configuration is invalid
   */
  static validateConfiguration() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('Master Key requires OPENAI_API_KEY environment variable to be set');
    }
    
    if (!this.defaultModel) {
      throw new Error('Master Key requires a default model to be specified');
    }
    
    lockInfo('✅ Master Key configuration validated successfully');
  }
}

export { MasterKey };
