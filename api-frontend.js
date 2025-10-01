/**
 * Frontend API client that calls our backend server
 * This avoids CORS issues by going through our own backend
 */

class TextTransformAPIClient {
  constructor(baseURL = '') {
    this.baseURL = baseURL;
  }

  async callAPI(text, action, options = {}) {
    try {
      const response = await fetch(`${this.baseURL}/api/transform`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text,
          action,
          options
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Server error: ${response.status}`);
      }

      return result;
    } catch (error) {
      console.error('API Client Error:', error);
      return {
        success: false,
        error: error.message,
        originalText: text,
        timestamp: new Date().toISOString()
      };
    }
  }

  async articulate(text, options = {}) {
    return await this.callAPI(text, 'ARTICULATE', options);
  }

  async refine(text, options = {}) {
    return await this.callAPI(text, 'REFINE', options);
  }

  async edit(text, instruction, options = {}) {
    return await this.callAPI(text, 'EDIT', { ...options, instruction });
  }

  async generateStyleGuide(exampleText, additionalInstructions = '') {
    try {
      const response = await fetch(`${this.baseURL}/api/generate-style-guide`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          exampleText,
          additionalInstructions
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Server error: ${response.status}`);
      }

      return result;
    } catch (error) {
      console.error('Style Guide Generation Error:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }


  async getModels() {
    try {
      const response = await fetch(`${this.baseURL}/api/models`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Server error: ${response.status}`);
      }

      return result;
    } catch (error) {
      console.error('Get Models Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async setModel(modelId) {
    try {
      const response = await fetch(`${this.baseURL}/api/models/set`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ modelId })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Server error: ${response.status}`);
      }

      return result;
    } catch (error) {
      console.error('Set Model Error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async checkHealth() {
    try {
      const response = await fetch(`${this.baseURL}/api/health`);
      return await response.json();
    } catch (error) {
      return {
        status: 'error',
        error: error.message
      };
    }
  }
}

// Export functions for direct use (matches the interface expected by v2.html)
let apiClient = null;

function initializeAPI() {
  apiClient = new TextTransformAPIClient();
  return apiClient;
}

async function articulateText(text, options = {}) {
  if (!apiClient) {
    throw new Error('API not initialized. Call initializeAPI() first.');
  }
  return await apiClient.articulate(text, options);
}

async function refineText(text, options = {}) {
  if (!apiClient) {
    throw new Error('API not initialized. Call initializeAPI() first.');
  }
  return await apiClient.refine(text, options);
}

async function editText(text, instruction, options = {}) {
  if (!apiClient) {
    throw new Error('API not initialized. Call initializeAPI() first.');
  }
  return await apiClient.edit(text, instruction, options);
}

async function generateStyleGuide(exampleText, additionalInstructions = '') {
  if (!apiClient) {
    throw new Error('API not initialized. Call initializeAPI() first.');
  }
  return await apiClient.generateStyleGuide(exampleText, additionalInstructions);
}

async function getModels() {
  if (!apiClient) {
    throw new Error('API not initialized. Call initializeAPI() first.');
  }
  return await apiClient.getModels();
}

async function setModel(modelId) {
  if (!apiClient) {
    throw new Error('API not initialized. Call initializeAPI() first.');
  }
  return await apiClient.setModel(modelId);
}

// Export both class and functions
export {
  TextTransformAPIClient,
  initializeAPI,
  articulateText,
  refineText,
  editText,
  generateStyleGuide,
  getModels,
  setModel
};

// Default export for convenience
export default TextTransformAPIClient;