import express from 'express';
import cors from 'cors';
import { TextTransformAPI } from './api.js';

const app = express();
const PORT = 3000;

// Initialize Claude API
const claudeAPI = new TextTransformAPI();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve static files from current directory

// API Routes
app.post('/api/generate-style-guide', async (req, res) => {
  try {
    const { exampleText, additionalInstructions = '' } = req.body;

    if (!exampleText || !exampleText.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: exampleText'
      });
    }

    const result = await claudeAPI.generateStyleGuide(exampleText.trim(), additionalInstructions);
    res.json(result);
  } catch (error) {
    console.error('Style Guide Generation Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.post('/api/transform', async (req, res) => {
  try {
    const { text, action, options = {} } = req.body;

    if (!text || !action) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: text and action'
      });
    }

    let result;

    switch (action) {
      case 'ARTICULATE':
        result = await claudeAPI.articulate(text, options);
        break;
      case 'REFINE':
        result = await claudeAPI.refine(text, options);
        break;
      case 'EDIT':
        if (!options.instruction) {
          return res.status(400).json({
            success: false,
            error: 'EDIT action requires instruction in options'
          });
        }
        result = await claudeAPI.edit(text, options.instruction, options);
        break;
      default:
        return res.status(400).json({
          success: false,
          error: `Unknown action: ${action}. Supported actions: ARTICULATE, REFINE, EDIT.`
        });
    }

    res.json(result);
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Model management endpoints
app.get('/api/models', (req, res) => {
  try {
    const models = claudeAPI.getAvailableModels();
    const current = claudeAPI.getCurrentModel();
    res.json({
      success: true,
      models: models,
      currentModel: current
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.post('/api/models/set', (req, res) => {
  try {
    const { modelId } = req.body;

    if (!modelId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: modelId'
      });
    }

    const success = claudeAPI.setModel(modelId);
    if (success) {
      const current = claudeAPI.getCurrentModel();
      res.json({
        success: true,
        currentModel: current
      });
    } else {
      res.status(400).json({
        success: false,
        error: `Invalid model ID: ${modelId}`
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const validation = await claudeAPI.validateConnection();
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      claude: validation
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Serve the main app
app.get('/', (req, res) => {
  res.redirect('/v2.html');
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Copy Refinery server running at http://localhost:${PORT}`);
  console.log(`📝 Open http://localhost:${PORT}/v2.html to use the app`);
  console.log(`🔧 API health check: http://localhost:${PORT}/api/health`);
});

export default app;