const { GoogleGenerativeAI } = require('@google/generative-ai');
const Project = require('../models/Project');

// Helper to clean Markdown wrappers around JSON response
const cleanJsonString = (str) => {
  let cleaned = str.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.substring(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.substring(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.substring(0, cleaned.length - 3);
  }
  return cleaned.trim();
};

// @desc    Generate brainstorming ideas using Gemini API
// @route   POST /api/ai/generate
// @access  Private (Project members only)
exports.generateIdeas = async (req, res, next) => {
  try {
    const { projectId, prompt } = req.body;

    if (!projectId || !prompt) {
      return res.status(400).json({ success: false, error: 'Project ID and custom prompt are required' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      console.log('Gemini API key is not configured. Using high-fidelity local brainstorming engine...');
      const fallbackIdeas = generateLocalBrainstorm(project.name, project.description, prompt);
      return res.status(200).json({
        success: true,
        source: 'local_brainstorm_simulator',
        data: fallbackIdeas
      });
    }

    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(apiKey);

    const aiPrompt = `
      You are CollabMind AI, an elite project management assistant.
      The project name is: "${project.name}"
      The project description is: "${project.description}"
      
      The user wants brainstorming ideas for the following prompt: "${prompt}"

      Generate a set of 4 to 6 highly relevant, actionable tasks or sub-projects.
      Return the output strictly in JSON format as a list of objects.
      Each object must have:
      1. "title": Short descriptive title of the task
      2. "description": 1-2 sentences detailing what this task involves and why it helps
      3. "priority": Either "High", "Medium", or "Low"
      4. "category": A classification tag (e.g., "Marketing", "Development", "Design", "Research")

      JSON structure example:
      [
        {
          "title": "Define target demographics",
          "description": "Research and construct 3 buyer personas based on competitor reviews and focus groups.",
          "priority": "High",
          "category": "Research"
        }
      ]
    `;

    const modelsToTry = [
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-pro',
      'gemini-2.5-flash'
    ];

    let result = null;
    let lastError = null;

    for (const modelName of modelsToTry) {
      try {
        console.log(`[Gemini] Attempting content generation with model: ${modelName}`);
        const config = { model: modelName };
        if (modelName !== 'gemini-pro') {
          config.generationConfig = { responseMimeType: "application/json" };
        }
        const model = genAI.getGenerativeModel(config);
        result = await model.generateContent(aiPrompt);
        if (result && result.response) {
          console.log(`[Gemini] Success using model: ${modelName}`);
          break;
        }
      } catch (err) {
        console.error(`[Gemini] Model ${modelName} failed:`, err.message);
        lastError = err;
      }
    }

    if (!result) {
      return res.status(500).json({
        success: false,
        error: `Gemini API failed on all attempted models. Last error: ${lastError ? lastError.message : 'Unknown'}`
      });
    }

    const response = await result.response;
    const text = response.text();
    
    try {
      const parsedData = JSON.parse(cleanJsonString(text));
      res.status(200).json({
        success: true,
        source: 'gemini_api',
        data: parsedData
      });
    } catch (parseErr) {
      console.error('Error parsing Gemini output as JSON, returning clean text array:', parseErr);
      res.status(200).json({
        success: true,
        source: 'gemini_api_text_raw',
        rawText: text,
        data: [
          {
            title: "Review AI Generation",
            description: "Gemini returned raw text. Review its response content: " + text.substring(0, 150),
            priority: "Medium",
            category: "General"
          }
        ]
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Generates simulated context-aware task breakdowns
function generateLocalBrainstorm(projName, projDesc, userPrompt) {
  const categories = ['Research', 'Development', 'Design', 'Marketing', 'Legal'];
  
  // Choose tasks based on keywords
  const promptLower = userPrompt.toLowerCase();
  const nameLower = projName.toLowerCase();
  const descLower = projDesc.toLowerCase();
  
  if (promptLower.includes('market') || promptLower.includes('sell') || promptLower.includes('launch')) {
    return [
      {
        title: "Define Target Customer Profile",
        description: `Analyze market needs related to ${projName} to create demographic sheets representing early adopters.`,
        priority: "High",
        category: "Marketing"
      },
      {
        title: "Launch Social Media Campaign",
        description: "Draft 5 release announcements highlighting core features and schedule posts on LinkedIn and Twitter.",
        priority: "Medium",
        category: "Marketing"
      },
      {
        title: "Setup Product Landing Page",
        description: "Design a high-converting landing page with registration forms, screenshots, and call-to-action buttons.",
        priority: "High",
        category: "Design"
      },
      {
        title: "Collect Beta User Feedback",
        description: "Distribute feedback surveys to initial testers to gather testimonials and identify usability issues.",
        priority: "Low",
        category: "Research"
      }
    ];
  } else if (promptLower.includes('tech') || promptLower.includes('develop') || promptLower.includes('code') || promptLower.includes('architecture')) {
    return [
      {
        title: "Draft System Architecture Design",
        description: `Map microservices, API request protocols, and database schema relationships for the ${projName} backend.`,
        priority: "High",
        category: "Development"
      },
      {
        title: "Configure CI/CD Deployment Pipelines",
        description: "Set up GitHub Actions to automatically run unit tests and trigger builds on commits.",
        priority: "Medium",
        category: "Development"
      },
      {
        title: "Create Core REST API Endpoints",
        description: "Implement routing, inputs validation schemas, and database model controller functions.",
        priority: "High",
        category: "Development"
      },
      {
        title: "Establish Authentication Flow",
        description: "Build robust JWT credentials validation with Bcrypt password hashing, session tokens, and route guards.",
        priority: "High",
        category: "Security"
      }
    ];
  } else {
    // Default general-purpose brainstorming
    return [
      {
        title: "Conduct Kickoff Brainstorming Session",
        description: `Organize a team meeting to align on milestones, timelines, and deliverables for "${projName}".`,
        priority: "High",
        category: "Research"
      },
      {
        title: "Create Mockups and User Flows",
        description: `Translate requirements from "${projDesc.substring(0, 50)}..." into wireframes and interactive mockups.`,
        priority: "Medium",
        category: "Design"
      },
      {
        title: "Outline Initial Technical Stack",
        description: "Confirm package options, database connectors, and cloud hosting parameters suitable for scale.",
        priority: "High",
        category: "Development"
      },
      {
        title: "Formulate Financial Budget Sheet",
        description: "Map hosting costs, third-party API subscriptions, and resource fees to set budget limits.",
        priority: "Medium",
        category: "Finance"
      }
    ];
  }
}
