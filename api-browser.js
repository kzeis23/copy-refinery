/**
 * Browser-compatible Text Transformation API using Claude HTTP API
 *
 * This module provides text transformation functions that use Claude's HTTP API
 * directly from the browser, without requiring Node.js dependencies.
 */

class TextTransformAPI {
  constructor(apiKey = null) {
    this.apiKey = apiKey;
    this.baseURL = 'https://api.anthropic.com/v1/messages';
    this.model = 'claude-3-5-sonnet-20241022'; // Using a stable model
    this.defaultParams = {
      max_tokens: 1000,
      temperature: 0.3
    };
  }

  /**
   * Core method to send transformation requests to Claude HTTP API
   */
  async transform(text, instruction, additionalParams = {}) {
    try {
      const systemPrompt = `You are a professional copywriting assistant. Your task is to transform the given text according to the specific instruction provided.

Rules:
- Return ONLY the transformed text, no explanations or additional commentary
- Preserve the original meaning and intent when possible
- Maintain appropriate tone and style for the context
- If the instruction is unclear, make your best interpretation`;

      const userPrompt = `Transform this text: "${text}"

Instruction: ${instruction}

${additionalParams.context ? `Additional context: ${additionalParams.context}` : ''}
${additionalParams.tone ? `Desired tone: ${additionalParams.tone}` : ''}
${additionalParams.targetLength ? `Target length: ${additionalParams.targetLength}` : ''}`;

      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: this.defaultParams.max_tokens,
          temperature: additionalParams.temperature || this.defaultParams.temperature,
          system: systemPrompt,
          messages: [
            {
              role: 'user',
              content: userPrompt
            }
          ]
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API Error ${response.status}: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const transformedText = data.content[0].text.trim();

      return {
        success: true,
        originalText: text,
        transformedText: transformedText,
        instruction: instruction,
        model: this.model,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Claude API Error:', error);
      return {
        success: false,
        error: error.message,
        originalText: text,
        instruction: instruction,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * SHORTEN: Make text more concise while preserving key information
   */
  async shorten(text, additionalParams = {}) {
    const instruction = `Make this text shorter and more concise. Remove unnecessary words, redundancy, and verbose phrasing while keeping all essential information and meaning. ${additionalParams.targetReduction ? `Aim to reduce length by approximately ${additionalParams.targetReduction}.` : 'Aim to reduce length by 30-50%.'}`;

    return await this.transform(text, instruction, {
      ...additionalParams,
      targetLength: additionalParams.targetLength || 'significantly shorter'
    });
  }

  /**
   * ELONGATE: Expand text with additional detail and elaboration
   */
  async elongate(text, additionalParams = {}) {
    const instruction = `Expand this text by adding relevant details, examples, and elaboration. ${additionalParams.expansionType || 'Add depth and richness to the content'} while maintaining the original message and tone. Do not repeat the same ideas - add genuinely new information.`;

    return await this.transform(text, instruction, {
      ...additionalParams,
      targetLength: additionalParams.targetLength || 'significantly longer'
    });
  }

  /**
   * SIMPLIFY: Make text easier to understand and more accessible
   */
  async simplify(text, additionalParams = {}) {
    const instruction = `Simplify this text to make it easier to understand. Use simpler words, shorter sentences, and clearer structure. ${additionalParams.targetAudience ? `Write for ${additionalParams.targetAudience}.` : 'Write for a general audience.'} Avoid jargon and complex terminology.`;

    return await this.transform(text, instruction, {
      ...additionalParams,
      tone: additionalParams.tone || 'clear and accessible'
    });
  }

  /**
   * CUSTOM: Apply custom transformation instruction
   */
  async custom(text, instruction, additionalParams = {}) {
    return await this.transform(text, instruction, additionalParams);
  }

  /**
   * Utility method to validate API key
   */
  async validateConnection() {
    try {
      const testResponse = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Hello' }]
        })
      });

      if (testResponse.ok) {
        return {
          success: true,
          message: 'API connection successful',
          model: this.model
        };
      } else {
        const errorData = await testResponse.json().catch(() => ({}));
        return {
          success: false,
          error: `${testResponse.status}: ${errorData.error?.message || testResponse.statusText}`
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Export functions for direct use (matches the interface expected by v2.html)
let apiInstance = null;

function initializeAPI(apiKey = null) {
  apiInstance = new TextTransformAPI(apiKey);
  return apiInstance;
}

async function shortenText(text, options = {}) {
  if (!apiInstance) {
    throw new Error('API not initialized. Call initializeAPI() first.');
  }
  return await apiInstance.shorten(text, options);
}

async function elongateText(text, options = {}) {
  if (!apiInstance) {
    throw new Error('API not initialized. Call initializeAPI() first.');
  }
  return await apiInstance.elongate(text, options);
}

async function simplifyText(text, options = {}) {
  if (!apiInstance) {
    throw new Error('API not initialized. Call initializeAPI() first.');
  }
  return await apiInstance.simplify(text, options);
}

async function customTransform(text, instruction, options = {}) {
  if (!apiInstance) {
    throw new Error('API not initialized. Call initializeAPI() first.');
  }
  return await apiInstance.custom(text, instruction, options);
}

// Export both class and functions
export {
  TextTransformAPI,
  initializeAPI,
  shortenText,
  elongateText,
  simplifyText,
  customTransform
};

// Default export for convenience
export default TextTransformAPI;