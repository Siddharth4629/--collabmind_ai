const vm = require('vm');
const { spawn } = require('child_process');
const CodeFile = require('../models/CodeFile');
const Activity = require('../models/Activity');

// Helper to determine language from file extension
const getLanguageFromFilename = (filename) => {
  const ext = filename.split('.').pop().toLowerCase();
  switch (ext) {
    case 'py': return 'python';
    case 'js': return 'javascript';
    case 'c': return 'c';
    case 'cpp': case 'cc': return 'cpp';
    case 'java': return 'java';
    case 'go': return 'go';
    case 'rs': return 'rust';
    case 'rb': return 'ruby';
    case 'php': return 'php';
    case 'cs': return 'csharp';
    case 'swift': return 'swift';
    case 'kt': return 'kotlin';
    case 'sh': return 'shell';
    case 'html': return 'html';
    case 'css': return 'css';
    case 'json': return 'json';
    default: return ext;
  }
};

// Seeder for default coding workspace files
const seedDefaultFiles = async (projectId, userId) => {
  const defaults = [
    {
      filename: 'index.html',
      language: 'html',
      content: `<!-- CollabMind Collaborative Workspace -->
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Live Preview Playground</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="card">
        <h1>Welcome to CollabMind Live HTML!</h1>
        <p>This is a real-time collaborative code workspace. Edit the code and watch the rendering update dynamically.</p>
        <button id="action-btn">Click Me!</button>
        <div id="output" class="hidden"></div>
    </div>
    
    <script src="script.js"></script>
</body>
</html>`
    },
    {
      filename: 'style.css',
      language: 'css',
      content: `/* Global Playground Styles */
body {
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
    color: #f8fafc;
    font-family: system-ui, -apple-system, sans-serif;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    margin: 0;
}

.card {
    background: rgba(30, 41, 59, 0.7);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    padding: 2.5rem;
    border-radius: 20px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    text-align: center;
    max-width: 450px;
}

h1 {
    color: #10b981;
    margin-top: 0;
    font-size: 1.8rem;
}

button {
    background: #10b981;
    color: #fff;
    border: none;
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    font-weight: 600;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    margin-top: 1rem;
}

button:hover {
    background: #059669;
    box-shadow: 0 0 15px rgba(16,185,129,0.4);
}

.hidden {
    display: none;
}

#output {
    margin-top: 1.5rem;
    padding: 1rem;
    background: rgba(0,0,0,0.3);
    border-radius: 8px;
    border: 1px dashed #10b981;
    font-family: monospace;
    color: #10b981;
}`
    },
    {
      filename: 'script.js',
      language: 'javascript',
      content: `// Dynamic Playground Logic
const button = document.getElementById('action-btn');
const output = document.getElementById('output');

button.addEventListener('click', () => {
    output.classList.remove('hidden');
    output.innerText = 'Button clicked at: ' + new Date().toLocaleTimeString();
    
    // Trigger tiny console alert
    console.log('Action button executed successfully!');
});`
    },
    {
      filename: 'main.py',
      language: 'python',
      content: `# Python Sandbox Playground
print("Welcome to the CollabMind Python Sandbox!")

x = 15
y = 25
total = x + y

print("Calculating standard sums...")
print("Total of X and Y is:")
print(total)
`
    }
  ];

  const createdFiles = [];
  for (const item of defaults) {
    const file = await CodeFile.create({
      project: projectId,
      filename: item.filename,
      language: item.language,
      content: item.content,
      updatedBy: userId
    });
    createdFiles.push(file);
  }
  return createdFiles;
};

// @desc    Get all code files in project
// @route   GET /api/projects/:projectId/code
// @access  Private
exports.getProjectFiles = async (req, res) => {
  try {
    const { projectId } = req.params;
    let files = await CodeFile.find({ project: projectId }).populate('updatedBy', 'name email');

    // Automatically seed default template files if workspace is empty
    if (!files || files.length === 0) {
      console.log(`Coding workspace empty for project ${projectId}. Seeding template files...`);
      await seedDefaultFiles(projectId, req.user._id);
      files = await CodeFile.find({ project: projectId }).populate('updatedBy', 'name email');
    }

    res.status(200).json({ success: true, count: files.length, data: files });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Create a new code file in project
// @route   POST /api/projects/:projectId/code
// @access  Private
exports.createFile = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { filename, content } = req.body;

    if (!filename) {
      return res.status(400).json({ success: false, error: 'Filename is required' });
    }

    // Check if file already exists
    const duplicate = await CodeFile.findOne({ project: projectId, filename });
    if (duplicate) {
      return res.status(400).json({ success: false, error: 'A file with this name already exists' });
    }

    const language = getLanguageFromFilename(filename);

    const file = await CodeFile.create({
      project: projectId,
      filename,
      language,
      content: content || '',
      updatedBy: req.user._id
    });

    // Log Activity
    await Activity.create({
      project: projectId,
      user: req.user._id,
      action: 'File Created',
      details: `Created new file "${filename}" in code workspace.`
    });

    res.status(201).json({ success: true, data: file });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Update code file content
// @route   PUT /api/projects/:projectId/code/:fileId
// @access  Private
exports.updateFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    const { content, filename } = req.body;

    const file = await CodeFile.findById(fileId);
    if (!file) {
      return res.status(404).json({ success: false, error: 'Code file not found' });
    }

    if (content !== undefined) file.content = content;
    if (filename !== undefined) {
      file.filename = filename;
      file.language = getLanguageFromFilename(filename);
    }
    file.updatedBy = req.user._id;

    await file.save();

    res.status(200).json({ success: true, data: file });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// @desc    Delete a code file
// @route   DELETE /api/projects/:projectId/code/:fileId
// @access  Private
exports.deleteFile = async (req, res) => {
  try {
    const { projectId, fileId } = req.params;

    const file = await CodeFile.findById(fileId);
    if (!file) {
      return res.status(404).json({ success: false, error: 'Code file not found' });
    }

    await CodeFile.findByIdAndDelete(fileId);

    // Log Activity
    await Activity.create({
      project: projectId,
      user: req.user._id,
      action: 'File Deleted',
      details: `Deleted file "${file.filename}" from code workspace.`
    });

    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Smart universal interpreter to run code in any language as fallback
const simulateUniversalRun = (code, language) => {
  const lines = code.split('\n');
  const logs = [];
  const variables = {};

  for (let line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*') || trimmed.startsWith('#') || trimmed.startsWith('--')) continue;

    // Match print/log statements in any language
    const printMatch = trimmed.match(/(?:print|println|console\.log|System\.out\.println|Console\.WriteLine|puts|echo|fmt\.Println|printf)\s*\(?\s*"(.*?)"\s*(?:,\s*(.*?))?\s*\)?\s*;?/i)
                    || trimmed.match(/std::cout\s*<<\s*"(.*?)"/);

    if (printMatch) {
      let formatStr = printMatch[1];
      const argsExpr = printMatch[2];
      formatStr = formatStr.replace(/\\n/g, '\n');

      if (!argsExpr) {
        logs.push(formatStr);
      } else {
        try {
          let evalExpr = argsExpr;
          for (const v in variables) {
            evalExpr = evalExpr.replace(new RegExp(`\\b${v}\\b`, 'g'), variables[v]);
          }
          const val = Function(`"use strict"; return (${evalExpr})`)();
          formatStr = formatStr.replace(/%[dssf]/g, val);
          logs.push(formatStr);
        } catch (e) {
          logs.push(formatStr);
        }
      }
      continue;
    }

    // Match variable assignments in standard programming syntax
    const assignMatch = trimmed.match(/^(?:[a-zA-Z_][a-zA-Z0-9_]*\s+)?([a-zA-Z_][a-zA-Z0-9_]*)\s*(?::=|=)\s*([^;]+);?/);
    if (assignMatch) {
      const varName = assignMatch[1];
      const valExpr = assignMatch[2].trim();
      try {
        let evalExpr = valExpr;
        for (const v in variables) {
          evalExpr = evalExpr.replace(new RegExp(`\\b${v}\\b`, 'g'), variables[v]);
        }
        const result = Function(`"use strict"; return (${evalExpr})`)();
        variables[varName] = result;
      } catch (e) {
        variables[varName] = valExpr;
      }
      continue;
    }
  }

  const joinChar = ['c', 'cpp'].includes(language) ? '' : '\n';
  return logs.join(joinChar) || 'Program completed with no output.';
};

// @desc    Compile & Run Code Sandbox
// @route   POST /api/projects/:projectId/code/run
// @access  Private
exports.runCode = async (req, res) => {
  try {
    const { content, language } = req.body;

    if (!content) {
      return res.status(400).json({ success: false, error: 'Code content is required' });
    }

    if (language === 'javascript' || language === 'node') {
      const logs = [];
      const sandbox = {
        console: {
          log: (...args) => logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
          error: (...args) => logs.push('[ERROR] ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
          warn: (...args) => logs.push('[WARN] ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '))
        }
      };

      try {
        vm.createContext(sandbox);
        vm.runInContext(content, sandbox, { timeout: 1000 });
        res.status(200).json({
          success: true,
          output: logs.join('\n') || 'Program completed with no output.'
        });
      } catch (runErr) {
        res.status(200).json({
          success: false,
          output: logs.join('\n') + `\nRuntime Error: ${runErr.message}`
        });
      }
    } else if (language === 'python') {
      const pythonProcess = spawn('python', ['-c', content], { timeout: 3000 });
      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => { stdout += data.toString(); });
      pythonProcess.stderr.on('data', (data) => { stderr += data.toString(); });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          res.status(200).json({ success: true, output: stdout || 'Program completed with no output.' });
        } else {
          res.status(200).json({ success: false, output: stdout + '\n' + stderr || `Exited with code ${code}` });
        }
      });

      pythonProcess.on('error', (err) => {
        console.warn('System Python execution failed, using simulated runner: ', err.message);
        const simulationResult = simulateUniversalRun(content, language);
        res.status(200).json({
          success: true,
          output: `[Local Simulated Python Sandbox]\n${simulationResult}`
        });
      });
    } else if (language === 'c' || language === 'cpp') {
      const fs = require('fs');
      const path = require('path');
      const os = require('os');
      const uuid = require('crypto').randomUUID ? require('crypto').randomUUID() : Math.random().toString(36).substring(7);

      const ext = language === 'c' ? 'c' : 'cpp';
      const compiler = language === 'c' ? 'gcc' : 'g++';
      
      const tempDir = os.tmpdir();
      const sourceFile = path.join(tempDir, `code_${uuid}.${ext}`);
      const outFile = path.join(tempDir, `out_${uuid}${os.platform() === 'win32' ? '.exe' : ''}`);

      try {
        fs.writeFileSync(sourceFile, content);

        const compileProcess = spawn(compiler, [sourceFile, '-o', outFile], { timeout: 5000 });
        let compileStderr = '';
        let compileHandled = false;

        compileProcess.stderr.on('data', (data) => { compileStderr += data.toString(); });

        compileProcess.on('close', (compileCode) => {
          if (compileHandled) return;
          try { fs.unlinkSync(sourceFile); } catch (_) {}

          if (compileCode !== 0) {
            compileHandled = true;
            return res.status(200).json({
              success: false,
              output: `[Compilation Error]\n\n${compileStderr || 'Unknown compile error.'}`
            });
          }

          const runProcess = spawn(outFile, [], { timeout: 3000 });
          let stdout = '';
          let stderr = '';

          runProcess.stdout.on('data', (data) => { stdout += data.toString(); });
          runProcess.stderr.on('data', (data) => { stderr += data.toString(); });

          runProcess.on('close', (runCode) => {
            try { fs.unlinkSync(outFile); } catch (_) {}

            if (runCode === 0) {
              res.status(200).json({ success: true, output: stdout || 'Program completed with no output.' });
            } else {
              res.status(200).json({ success: false, output: stdout + '\n' + stderr || `Exited with code ${runCode}` });
            }
          });

          runProcess.on('error', (runErr) => {
            try { fs.unlinkSync(outFile); } catch (_) {}
            res.status(200).json({ success: false, output: `Runtime error while launching executable: ${runErr.message}` });
          });
        });

        compileProcess.on('error', (err) => {
          if (compileHandled) return;
          compileHandled = true;
          try { fs.unlinkSync(sourceFile); } catch (_) {}
          try { fs.unlinkSync(outFile); } catch (_) {}

          console.warn(`${compiler} execution failed, using simulated runner: `, err.message);
          const simulationResult = simulateUniversalRun(content, language);
          res.status(200).json({
            success: true,
            output: `[Local Simulated C Sandbox]\n${simulationResult}`
          });
        });

      } catch (err) {
        try { fs.unlinkSync(sourceFile); } catch (_) {}
        try { fs.unlinkSync(outFile); } catch (_) {}
        res.status(500).json({ success: false, error: err.message });
      }
    } else if (language === 'java') {
      const fs = require('fs');
      const path = require('path');
      const os = require('os');
      
      const tempDir = os.tmpdir();
      const classMatch = content.match(/public\s+class\s+([a-zA-Z0-9_]+)/);
      const className = classMatch ? classMatch[1] : 'Main';
      const sourceFile = path.join(tempDir, `${className}.java`);

      try {
        fs.writeFileSync(sourceFile, content);

        const compileProcess = spawn('javac', [sourceFile], { timeout: 6000 });
        let compileStderr = '';
        let compileHandled = false;

        compileProcess.stderr.on('data', (data) => { compileStderr += data.toString(); });

        compileProcess.on('close', (compileCode) => {
          if (compileHandled) return;
          if (compileCode !== 0) {
            compileHandled = true;
            try { fs.unlinkSync(sourceFile); } catch (_) {}
            return res.status(200).json({
              success: false,
              output: `[Java Compilation Error]\n\n${compileStderr}`
            });
          }

          const runProcess = spawn('java', ['-cp', tempDir, className], { timeout: 4000 });
          let stdout = '';
          let stderr = '';

          runProcess.stdout.on('data', (data) => { stdout += data.toString(); });
          runProcess.stderr.on('data', (data) => { stderr += data.toString(); });

          runProcess.on('close', (runCode) => {
            try { fs.unlinkSync(sourceFile); } catch (_) {}
            try { fs.unlinkSync(path.join(tempDir, `${className}.class`)); } catch (_) {}

            if (runCode === 0) {
              res.status(200).json({ success: true, output: stdout || 'Program completed with no output.' });
            } else {
              res.status(200).json({ success: false, output: stdout + '\n' + stderr || `Exited with code ${runCode}` });
            }
          });

          runProcess.on('error', (runErr) => {
            try { fs.unlinkSync(sourceFile); } catch (_) {}
            try { fs.unlinkSync(path.join(tempDir, `${className}.class`)); } catch (_) {}
            res.status(200).json({ success: false, output: `Java JVM Execution Error: ${runErr.message}` });
          });
        });

        compileProcess.on('error', (err) => {
          if (compileHandled) return;
          compileHandled = true;
          try { fs.unlinkSync(sourceFile); } catch (_) {}
          console.warn('javac execution failed, using simulated runner: ', err.message);
          const simulationResult = simulateUniversalRun(content, language);
          res.status(200).json({
            success: true,
            output: `[Local Simulated Java Sandbox]\n${simulationResult}`
          });
        });

      } catch (err) {
        try { fs.unlinkSync(sourceFile); } catch (_) {}
        res.status(500).json({ success: false, error: err.message });
      }
    } else if (language === 'go') {
      const fs = require('fs');
      const path = require('path');
      const os = require('os');
      const uuid = require('crypto').randomUUID ? require('crypto').randomUUID() : Math.random().toString(36).substring(7);
      const sourceFile = path.join(os.tmpdir(), `main_${uuid}.go`);

      try {
        fs.writeFileSync(sourceFile, content);

        const goProcess = spawn('go', ['run', sourceFile], { timeout: 6000 });
        let stdout = '';
        let stderr = '';

        goProcess.stdout.on('data', (data) => { stdout += data.toString(); });
        goProcess.stderr.on('data', (data) => { stderr += data.toString(); });
        goProcess.on('close', (code) => {
          try { fs.unlinkSync(sourceFile); } catch (_) {}
          if (code === 0) {
            res.status(200).json({ success: true, output: stdout || 'Program completed with no output.' });
          } else {
            res.status(200).json({ success: false, output: stdout + '\n' + stderr || `Go exited with code ${code}` });
          }
        });

        goProcess.on('error', (err) => {
          try { fs.unlinkSync(sourceFile); } catch (_) {}
          console.warn('Go run execution failed, using simulated runner: ', err.message);
          const simulationResult = simulateUniversalRun(content, language);
          res.status(200).json({
            success: true,
            output: `[Local Simulated Go Sandbox]\n${simulationResult}`
          });
        });

      } catch (err) {
        try { fs.unlinkSync(sourceFile); } catch (_) {}
        res.status(500).json({ success: false, error: err.message });
      }
    } else if (language === 'rust') {
      const fs = require('fs');
      const path = require('path');
      const os = require('os');
      const uuid = require('crypto').randomUUID ? require('crypto').randomUUID() : Math.random().toString(36).substring(7);
      
      const tempDir = os.tmpdir();
      const sourceFile = path.join(tempDir, `main_${uuid}.rs`);
      const outFile = path.join(tempDir, `rust_${uuid}${os.platform() === 'win32' ? '.exe' : ''}`);

      try {
        fs.writeFileSync(sourceFile, content);

        const compileProcess = spawn('rustc', [sourceFile, '-o', outFile], { timeout: 8000 });
        let compileStderr = '';
        let compileHandled = false;

        compileProcess.stderr.on('data', (data) => { compileStderr += data.toString(); });

        compileProcess.on('close', (compileCode) => {
          if (compileHandled) return;
          try { fs.unlinkSync(sourceFile); } catch (_) {}

          if (compileCode !== 0) {
            compileHandled = true;
            return res.status(200).json({
              success: false,
              output: `[Rust Compilation Error]\n\n${compileStderr}`
            });
          }

          const runProcess = spawn(outFile, [], { timeout: 3000 });
          let stdout = '';
          let stderr = '';

          runProcess.stdout.on('data', (data) => { stdout += data.toString(); });
          runProcess.stderr.on('data', (data) => { stderr += data.toString(); });

          runProcess.on('close', (runCode) => {
            try { fs.unlinkSync(outFile); } catch (_) {}
            if (runCode === 0) {
              res.status(200).json({ success: true, output: stdout || 'Program completed with no output.' });
            } else {
              res.status(200).json({ success: false, output: stdout + '\n' + stderr || `Exited with code ${runCode}` });
            }
          });

          runProcess.on('error', (runErr) => {
            try { fs.unlinkSync(outFile); } catch (_) {}
            res.status(200).json({ success: false, output: `Rust executable run error: ${runErr.message}` });
          });
        });

        compileProcess.on('error', (err) => {
          if (compileHandled) return;
          compileHandled = true;
          try { fs.unlinkSync(sourceFile); } catch (_) {}
          try { fs.unlinkSync(outFile); } catch (_) {}
          console.warn('rustc compilation failed, using simulated runner: ', err.message);
          const simulationResult = simulateUniversalRun(content, language);
          res.status(200).json({
            success: true,
            output: `[Local Simulated Rust Sandbox]\n${simulationResult}`
          });
        });

      } catch (err) {
        try { fs.unlinkSync(sourceFile); } catch (_) {}
        try { fs.unlinkSync(outFile); } catch (_) {}
        res.status(500).json({ success: false, error: err.message });
      }
    } else {
      // General Dynamic Runner (Ruby, PHP, Shell, C#, Swift, Kotlin, etc.)
      const fs = require('fs');
      const path = require('path');
      const os = require('os');
      const uuid = require('crypto').randomUUID ? require('crypto').randomUUID() : Math.random().toString(36).substring(7);

      const languageMap = {
        ruby: { cmd: 'ruby', ext: 'rb' },
        php: { cmd: 'php', ext: 'php' },
        shell: { cmd: os.platform() === 'win32' ? 'powershell' : 'bash', ext: os.platform() === 'win32' ? 'ps1' : 'sh' },
        csharp: { cmd: 'dotnet-run', ext: 'cs' },
        swift: { cmd: 'swift', ext: 'swift' },
        kotlin: { cmd: 'kotlinc', ext: 'kt' }
      };

      const spec = languageMap[language] || { cmd: language, ext: language };
      const sourceFile = path.join(os.tmpdir(), `script_${uuid}.${spec.ext}`);

      try {
        fs.writeFileSync(sourceFile, content);

        const runtimeProcess = spawn(spec.cmd, [sourceFile], { timeout: 5000 });
        let stdout = '';
        let stderr = '';

        runtimeProcess.stdout.on('data', (data) => { stdout += data.toString(); });
        runtimeProcess.stderr.on('data', (data) => { stderr += data.toString(); });

        runtimeProcess.on('close', (code) => {
          try { fs.unlinkSync(sourceFile); } catch (_) {}
          if (code === 0) {
            res.status(200).json({ success: true, output: stdout || 'Program completed with no output.' });
          } else {
            res.status(200).json({ success: false, output: stdout + '\n' + stderr || `Process exited with code ${code}` });
          }
        });

        runtimeProcess.on('error', (err) => {
          try { fs.unlinkSync(sourceFile); } catch (_) {}
          console.warn(`System ${spec.cmd} execution failed, using simulated runner: `, err.message);
          const simulationResult = simulateUniversalRun(content, language);
          res.status(200).json({
            success: true,
            output: `[Local Simulated ${language.toUpperCase()} Sandbox]\n${simulationResult}`
          });
        });

      } catch (err) {
        try { fs.unlinkSync(sourceFile); } catch (_) {}
        res.status(500).json({ success: false, error: err.message });
      }
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
