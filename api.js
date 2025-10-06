import Anthropic from '@anthropic-ai/sdk';

/**
 * Text Transformation API using Claude
 *
 * This module provides text transformation functions that use Claude's AI
 * to intelligently modify text based on specific instructions.
 */

class TextTransformAPI {
  constructor(apiKey = null) {
    // Initialize Claude client
    this.client = new Anthropic({
      apiKey: apiKey || process.env.ANTHROPIC_API_KEY
    });

    // Available models with metadata
    this.availableModels = {
      'claude-sonnet-4-5-20250929': {
        name: 'Claude Sonnet 4.5',
        description: 'Latest & most intelligent - exceptional agent & coding capabilities',
        pricing: '$3/$15 per MTok',
        recommended: true
      },
      'claude-opus-4-1-20250805': {
        name: 'Claude Opus 4.1',
        description: 'Premium model for complex tasks requiring advanced reasoning',
        pricing: '$15/$75 per MTok',
        premium: true
      },
      'claude-sonnet-4-20250514': {
        name: 'Claude Sonnet 4',
        description: 'Balanced performance - current default',
        pricing: '$3/$15 per MTok'
      },
      'claude-3-5-haiku-20241022': {
        name: 'Claude Haiku 3.5',
        description: 'Fast & cost-effective for quick responses',
        pricing: '$0.80/$4 per MTok',
        fast: true
      }
    };

    // Default model - using latest Sonnet 4.5
    this.model = 'claude-sonnet-4-5-20250929';

    // Default parameters
    this.defaultParams = {
      max_tokens: 8000, // High limit for complex transformations and JSON templates
      temperature: 0.3 // Lower temperature for more consistent transformations
    };
  }

  /**
   * Set the model to use for API calls
   */
  setModel(modelId) {
    if (this.availableModels[modelId]) {
      this.model = modelId;
      return true;
    }
    return false;
  }

  /**
   * Get available models list
   */
  getAvailableModels() {
    return this.availableModels;
  }

  /**
   * Get current model info
   */
  getCurrentModel() {
    return {
      id: this.model,
      ...this.availableModels[this.model]
    };
  }

  /**
   * Core method to send transformation requests to Claude
   */
  async transform(text, instruction, additionalParams = {}) {
    try {
      // Choose system prompt based on function type
      let systemPrompt;

      // Select appropriate style guide based on function type
      let selectedStyleGuide = null;
      if (additionalParams.styleGuide) {
        // If it's a comprehensive style guide object with both guides
        if (typeof additionalParams.styleGuide === 'object' && additionalParams.styleGuide.comprehensiveGuide) {
          // Use comprehensive guide for ARTICULATE, concise guide for REFINE/EDIT
          selectedStyleGuide = additionalParams.systemPrompt === 'articulate'
            ? additionalParams.styleGuide.comprehensiveGuide
            : (additionalParams.styleGuide.conciseGuide || additionalParams.styleGuide.comprehensiveGuide);
        } else {
          // Backward compatibility - use as-is for legacy style guides
          selectedStyleGuide = typeof additionalParams.styleGuide === 'string'
            ? additionalParams.styleGuide
            : additionalParams.styleGuide.styleGuide;
        }
      }

      if (additionalParams.systemPrompt === 'articulate') {
        systemPrompt = `Du bist ein erfahrener Copywriter, spezialisiert darauf, rohe Gedankenstrukturen und fragmentierte Ideen in vollständig ausformulierte, fließende Texte zu verwandeln.

DEINE AUFGABE:
Nimm AUSSCHLIESSLICH die gegebene Struktur aus Gedankenfragmenten, Stichpunkten oder groben Ideen und entwickle daraus einen vollständig ausformulierten, kohärenten Text. Du darfst NICHT den Kontext oder andere Textteile bearbeiten - nur den spezifisch markierten Text.

${additionalParams.mode === 'json' ? `JSON TEMPLATE MODUS:
Du arbeitest mit einem JSON-Template für Advertorial-Seiten. Der Kontext enthält technische JSON-Struktur, aber du sollst AUSSCHLIESSLICH den markierten Copy-Text transformieren. Ignoriere alle JSON-Syntax, technischen Felder, URLs, Dateipfade, Variablennamen und strukturelle Elemente. Konzentriere dich NUR auf den Marketing-Copy-Inhalt.

WICHTIG: Du transformierst NUR den selektierten Copy-Text, nicht die JSON-Struktur!

` : ''}TRANSFORMATION PRINCIPLES:
• Erkenne die beabsichtigte Gedankenfolge und logische Struktur
• Schaffe natürliche Übergänge zwischen den Gedanken
• Fülle Lücken in der Argumentation intelligent aus
• Entwickle jeden Punkt zu vollständigen, fließenden Sätzen
• Wahre die ursprüngliche Intention und Reihenfolge
• Erschaffe einen natürlichen, lesbaren Textfluss

INDUKTIVES COPYWRITING-PRINZIP (besonders bei längeren Texten):
• Jeder Satz soll genügend Neugier für den nächsten Satz erzeugen
• Schaffe eine "Satz-zu-Satz-Induktion": Verwende offene Schleifen, Andeutungen oder Versprechungen, die den Leser weiterlesen lassen
• Vermeide vorzeitige Auflösung - baue schrittweise Spannung und Interesse auf
• Nutze Cliffhanger-Elemente am Satzende, um nahtlose Übergänge zu schaffen
• Implementiere dieses Prinzip organisch - nie zwanghaft oder künstlich
• Denke an Eugene Schwartz' Fundamental: Der Zweck jedes Satzes ist es, den nächsten gelesen zu bekommen

${selectedStyleGuide ? `STIL-VORGABEN:
Befolge diesen Style Guide bei der Ausformulierung:
${selectedStyleGuide}

Achte besonders auf:
- Konsistenz mit den Stil-Beispielen
- Einhaltung der definierten Regeln
- Beibehaltung des charakteristischen Tons

` : ''}WICHTIGE OUTPUT-REGEL:
Du darfst AUSSCHLIESSLICH den transformierten Text ausgeben. Keine Einleitungen, keine Erklärungen, keine Kommentare, keine Anführungszeichen, keine Formatierungshinweise - nur der reine, ausformulierte Text.

Beginne sofort mit dem ersten Wort des transformierten Textes und höre mit dem letzten Wort auf.`;
      } else if (additionalParams.systemPrompt === 'refine') {
        systemPrompt = `Du bist ein Textredakteur und Copy-Editor mit höchsten Qualitätsstandards. Deine Expertise liegt darin, bestehende Texte zu perfektionieren, ohne deren Kernaussage oder Persönlichkeit zu verändern.

DEINE AUFGABE:
Verfeinere AUSSCHLIESSLICH den gegebenen markierten Text durch Verbesserung von Formulierung, Stil, Grammatik und Fluss, während du die ursprüngliche Intention vollständig bewahrst. Du darfst NICHT den Kontext oder andere Textteile bearbeiten - nur den spezifisch markierten Text.

${additionalParams.mode === 'json' ? `JSON TEMPLATE MODUS:
Du arbeitest mit einem JSON-Template für Advertorial-Seiten. Der Kontext enthält technische JSON-Struktur, aber du sollst AUSSCHLIESSLICH den markierten Copy-Text verfeinern. Ignoriere alle JSON-Syntax, technischen Felder, URLs, Dateipfade, Variablennamen und strukturelle Elemente. Konzentriere dich NUR auf die Verbesserung des Marketing-Copy-Inhalts.

WICHTIG: Du verfeinerst NUR den selektierten Copy-Text, nicht die JSON-Struktur!

` : ''}VERFEINERUNGS-PRINZIPIEN:
• Korrigiere grammatische und stilistische Fehler
• Optimiere Wortwahl und Satzstrukturen
• Verbessere Lesbarkeit und Textfluss
• Entferne Redundanzen und Füllwörter
• Verstärke Klarheit und Prägnanz
• Bewahre die ursprüngliche Stimme und Persönlichkeit
• Halte alle Fakten und Kernaussagen bei

${selectedStyleGuide ? `STIL-VORGABEN:
Befolge diesen Style Guide bei der Verfeinerung:
${selectedStyleGuide}

Achte besonders auf:
- Konsistenz mit den Stil-Beispielen
- Einhaltung der definierten Regeln
- Beibehaltung des charakteristischen Tons

` : ''}WICHTIGE OUTPUT-REGEL:
Du darfst AUSSCHLIESSLICH den verfeinerten Text ausgeben. Keine Einleitungen, keine Erklärungen, keine Kommentare, keine Anführungszeichen, keine Formatierungshinweise - nur der reine, verbesserte Text.

Beginne sofort mit dem ersten Wort des verfeinerten Textes und höre mit dem letzten Wort auf.`;
      } else if (additionalParams.systemPrompt === 'edit') {
        systemPrompt = `Du bist ein professioneller Text-Editor mit höchster Präzision. Deine Aufgabe ist es, den gegebenen Text exakt nach den spezifischen Anweisungen zu bearbeiten.

DEINE AUFGABE:
Führe die gegebene Bearbeitungsanweisung AUSSCHLIESSLICH am markierten Text präzise aus, ohne die grundlegende Intention oder den Kontext zu verändern. Du darfst NICHT den Kontext oder andere Textteile bearbeiten - nur den spezifisch markierten Text.

${additionalParams.mode === 'json' ? `JSON TEMPLATE MODUS:
Du arbeitest mit einem JSON-Template für Advertorial-Seiten. Der Kontext enthält technische JSON-Struktur, aber du sollst AUSSCHLIESSLICH den markierten Copy-Text nach der Anweisung bearbeiten. Ignoriere alle JSON-Syntax, technischen Felder, URLs, Dateipfade, Variablennamen und strukturelle Elemente. Konzentriere dich NUR auf die Bearbeitung des Marketing-Copy-Inhalts.

WICHTIG: Du bearbeitest NUR den selektierten Copy-Text, nicht die JSON-Struktur!

` : ''}BEARBEITUNGS-PRINZIPIEN:
• Befolge die Anweisung exakt und vollständig
• Behalte die ursprüngliche Bedeutung bei, außer explizit anders angewiesen
• Mache nur die angeforderten Änderungen
• Bewahre den ursprünglichen Stil, außer er soll geändert werden
• Bei unklaren Anweisungen, interpretiere im Kontext des Textes
• Arbeite präzise und zielgerichtet

${selectedStyleGuide ? `STIL-VORGABEN:
Befolge diesen Style Guide bei der Bearbeitung:
${selectedStyleGuide}

Achte besonders auf:
- Konsistenz mit den Stil-Beispielen
- Einhaltung der definierten Regeln
- Beibehaltung des charakteristischen Tons

` : ''}WICHTIGE OUTPUT-REGEL:
Du darfst AUSSCHLIESSLICH den bearbeiteten Text ausgeben. Keine Einleitungen, keine Erklärungen, keine Kommentare, keine Anführungszeichen, keine Formatierungshinweise - nur der reine, bearbeitete Text.

Beginne sofort mit dem ersten Wort des bearbeiteten Textes und höre mit dem letzten Wort auf.`;
      } else {
        systemPrompt = `Du bist ein professioneller Texting-Assistent. Deine Aufgabe ist es, den gegebenen Text gemäß der spezifischen Anweisung umzuformen.

Regeln:
- Bewahre die ursprüngliche Bedeutung und Absicht soweit möglich
- Behalte den angemessenen Ton und Stil für den Kontext bei
- Falls die Anweisung unklar ist, interpretiere sie bestmöglich

WICHTIGE OUTPUT-REGEL:
Du darfst AUSSCHLIESSLICH den umgeformten Text ausgeben. Keine Einleitungen, keine Erklärungen, keine Kommentare, keine Anführungszeichen, keine Formatierungshinweise - nur der reine, umgeformte Text.

Beginne sofort mit dem ersten Wort des umgeformten Textes und höre mit dem letzten Wort auf.`;
      }

      const userPrompt = `${additionalParams.systemPrompt === 'articulate' ? 'ROHE GEDANKENSTRUKTUR ZUM TRANSFORMIEREN:' : additionalParams.systemPrompt === 'refine' ? 'TEXT ZUM VERFEINERN:' : additionalParams.systemPrompt === 'edit' ? 'TEXT ZUM BEARBEITEN:' : 'Forme diesen Text um:'}
"${text}"

ANWEISUNGEN:
${instruction}

${additionalParams.context ? `KONTEXT (Gesamter Text im Editor - NUR als Referenz, NICHT bearbeiten):
${additionalParams.context}

WICHTIG: Transformiere AUSSCHLIESSLICH den oben markierten Text ("${additionalParams.systemPrompt === 'articulate' ? 'ROHE GEDANKENSTRUKTUR ZUM TRANSFORMIEREN' : additionalParams.systemPrompt === 'refine' ? 'TEXT ZUM VERFEINERN' : additionalParams.systemPrompt === 'edit' ? 'TEXT ZUM BEARBEITEN' : 'Text'}"). Der Kontext dient nur als Referenz für besseres Verständnis, soll aber NICHT verändert oder mit in die Ausgabe einbezogen werden.` : ''}

AUFGABE: ${additionalParams.systemPrompt === 'articulate' ? 'Transformiere NUR die markierte rohe Struktur in einen vollständig ausformulierten, fließenden Text.' : additionalParams.systemPrompt === 'refine' ? 'Verfeinere NUR den markierten Text durch Verbesserung von Formulierung, Stil und Fluss.' : additionalParams.systemPrompt === 'edit' ? 'Führe die Bearbeitungsanweisung präzise NUR am markierten Text aus.' : 'Forme NUR den markierten Text entsprechend der Anweisung um.'}`;

      // Debug logging
      console.log('🔧 API TRANSFORM DEBUG:');
      console.log('📝 Input text:', `"${text}"`);
      console.log('📋 Instruction:', `"${instruction}"`);
      console.log('🏷️ Mode:', additionalParams.mode);
      console.log('🎭 System prompt type:', additionalParams.systemPrompt);
      console.log('📄 Context length:', additionalParams.context ? additionalParams.context.length : 0);
      console.log('🎨 Style guide present:', !!selectedStyleGuide);
      console.log('📤 Full user prompt length:', userPrompt.length);
      console.log('📤 User prompt preview:', userPrompt.substring(0, 500) + '...');

      const message = await this.client.messages.create({
        model: this.model,
        max_tokens: additionalParams.max_tokens || this.defaultParams.max_tokens,
        temperature: additionalParams.temperature || this.defaultParams.temperature,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt
          }
        ]
      });

      // Extract the text content from Claude's response
      const transformedText = message.content[0].text.trim();

      console.log('📥 Claude response received:');
      console.log('📤 Original text:', `"${text}"`);
      console.log('📥 Transformed text:', `"${transformedText}"`);
      console.log('🔄 Length change:', `${text.length} → ${transformedText.length} (${transformedText.length - text.length > 0 ? '+' : ''}${transformedText.length - text.length})`);
      console.log('🎯 Model used:', this.model);

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
   * ARTICULATE: Transform rough ideas into fully articulated text
   */
  async articulate(text, additionalParams = {}) {
    const instruction = `Entwickle aus der gegebenen Gedankenstruktur einen vollständig ausformulierten, fließenden Text. Schaffe natürliche Übergänge, fülle logische Lücken und verwandle Fragmente in kohärente, überzeugende Prosa.`;

    return await this.transform(text, instruction, {
      ...additionalParams,
      systemPrompt: 'articulate',
      max_tokens: 8000 // Much higher limit for long articulation tasks
    });
  }

  /**
   * REFINE: Improve existing text while preserving original intent
   */
  async refine(text, additionalParams = {}) {
    const instruction = `Verfeinere diesen Text durch Optimierung von Formulierung, Grammatik und Stil. Verbessere Klarheit und Lesbarkeit, während du die ursprüngliche Aussage und den Charakter des Textes vollständig bewahrst.`;

    return await this.transform(text, instruction, {
      ...additionalParams,
      systemPrompt: 'refine',
      max_tokens: 8000 // Much higher limit for long refinement tasks
    });
  }

  /**
   * EDIT: Apply custom editing instructions to text
   */
  async edit(text, instruction, additionalParams = {}) {
    if (!instruction || !instruction.trim()) {
      throw new Error('EDIT function requires a specific instruction');
    }

    return await this.transform(text, instruction.trim(), {
      ...additionalParams,
      systemPrompt: 'edit',
      max_tokens: 8000 // Higher limit for complex editing tasks, especially JSON templates
    });
  }

  /**
   * GENERATE_STYLE_GUIDE: Analyze example text and create a comprehensive style guide
   */
  async generateStyleGuide(exampleText, additionalInstructions = '') {
    try {
      const systemPrompt = `Du bist ein Experte für Textanalyse und Stil-Dokumentation. Deine Aufgabe ist es, aus gegebenem Beispieltext zwei komplementäre Style Guides zu erstellen, die für verschiedene Arten der Textproduktion verwendet werden.

AUFGABE:
Analysiere den gegebenen Beispieltext gründlich und erstelle ZWEI Style Guides: einen umfassenden für Grund-Textentwicklung und einen präzisen für Textverfeinerung. Der Output soll eine umfassende Charakterisierung des Stils und nichts anderem! Der Inhalt ist völlig irrelevant. Dazu zählt auch alles struktur-inhaltliche. Der Output-Prompt soll zum Beispiel nicht dahin leiten, zum Anfang einen bestimmten strukturellen Inhalt zu erzwingen. Es geht um alles, was den Text beschreibt und nicht inhaltlich ist - also alles stilistische.

ANALYSE-ASPEKTE:
• Tonfall und Stimmung
• Satzstruktur und -länge
• Wortwahl und Vokabular
• Stilistische Besonderheiten
• Zielgruppe und Ansprache (keine inhaltlichen Angaben!)
• Formalitätsgrad
• Rhetorische Mittel

OUTPUT FORMAT:
=== UMFASSENDER STYLE GUIDE (für Grund-Textentwicklung) ===

● TON: [Beschreibung des charakteristischen Tons]
● STIL-MERKMALE: [Spezifische stilistische Charakteristika]
● BEISPIELE: [3-5 konkrete, repräsentative Textausschnitte aus dem Original - achte darauf, zwingend im Output zu betonen, dass diese Beispiele nicht als inhaltliche Beispiele zu sehen sind, sondern ausschließlich für das Stilverständnis.]
● SCHREIBREGELN: [Konkrete Regeln für konsistente Textproduktion]
● WORTWAHL: [Typische Begriffe, Wendungen und Formulierungsmuster]
● VERMEIDEN: [Was nicht zu diesem Stil passt]

=== PRÄZISER STYLE GUIDE (für Textverfeinerung) ===

● TON: [Kernaspekte des Tons - kompakt]
● SATZSTRUKTUR: [Bevorzugte Länge und Rhythmus]
● WORTWAHL: [Schlüsselbegriffe und typische Wendungen]
● FORMALITÄT: [Grad der Förmlichkeit]
● VERMEIDEN: [Wichtigste Stil-Fallen]

WICHTIG: Beide Style Guides sollen konkret und anwendbar sein, damit andere Texte im gleichen Stil erstellt werden können. Der umfassende Guide dient der Grund-Textentwicklung, der präzise Guide der gezielten Verfeinerung.`;

      const userPrompt = `BEISPIELTEXT ZUM ANALYSIEREN:
"${exampleText}"

${additionalInstructions ? `ZUSÄTZLICHE ANWEISUNGEN:
${additionalInstructions}

` : ''}AUFGABE: Erstelle BEIDE Style Guides (umfassend + präzise) basierend auf diesem Beispieltext.`;

      const message = await this.client.messages.create({
        model: this.model,
        max_tokens: 6000,
        temperature: 0.3,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt
          }
        ]
      });

      const fullResponse = message.content[0].text.trim();

      // Parse the dual style guide response
      const comprehensiveMatch = fullResponse.match(/=== UMFASSENDER STYLE GUIDE.*?===(.*?)(?==== PRÄZISER STYLE GUIDE|$)/s);
      const conciseMatch = fullResponse.match(/=== PRÄZISER STYLE GUIDE.*?===(.*?)$/s);

      const comprehensiveGuide = comprehensiveMatch ? comprehensiveMatch[1].trim() : fullResponse;
      const conciseGuide = conciseMatch ? conciseMatch[1].trim() : '';

      return {
        success: true,
        styleGuide: comprehensiveGuide, // Keep for backward compatibility
        comprehensiveGuide: comprehensiveGuide,
        conciseGuide: conciseGuide,
        fullResponse: fullResponse, // Store the complete response for display
        exampleText: exampleText,
        additionalInstructions: additionalInstructions,
        model: this.model,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Style Guide Generation Error:', error);
      return {
        success: false,
        error: error.message,
        exampleText: exampleText,
        timestamp: new Date().toISOString()
      };
    }
  }


  /**
   * Utility method to validate API key
   */
  async validateConnection() {
    try {
      const testMessage = await this.client.messages.create({
        model: this.model,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hello' }]
      });

      return {
        success: true,
        message: 'API connection successful',
        model: this.model
      };
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

async function articulateText(text, options = {}) {
  if (!apiInstance) {
    throw new Error('API not initialized. Call initializeAPI() first.');
  }
  return await apiInstance.articulate(text, options);
}

async function refineText(text, options = {}) {
  if (!apiInstance) {
    throw new Error('API not initialized. Call initializeAPI() first.');
  }
  return await apiInstance.refine(text, options);
}

async function editText(text, instruction, options = {}) {
  if (!apiInstance) {
    throw new Error('API not initialized. Call initializeAPI() first.');
  }
  return await apiInstance.edit(text, instruction, options);
}

async function generateStyleGuide(exampleText, additionalInstructions = '') {
  if (!apiInstance) {
    throw new Error('API not initialized. Call initializeAPI() first.');
  }
  return await apiInstance.generateStyleGuide(exampleText, additionalInstructions);
}

function setModel(modelId) {
  if (!apiInstance) {
    throw new Error('API not initialized. Call initializeAPI() first.');
  }
  return apiInstance.setModel(modelId);
}

function getAvailableModels() {
  if (!apiInstance) {
    throw new Error('API not initialized. Call initializeAPI() first.');
  }
  return apiInstance.getAvailableModels();
}

function getCurrentModel() {
  if (!apiInstance) {
    throw new Error('API not initialized. Call initializeAPI() first.');
  }
  return apiInstance.getCurrentModel();
}

// Export both class and functions
export {
  TextTransformAPI,
  initializeAPI,
  articulateText,
  refineText,
  editText,
  generateStyleGuide,
  setModel,
  getAvailableModels,
  getCurrentModel
};

// Default export for convenience
export default TextTransformAPI;