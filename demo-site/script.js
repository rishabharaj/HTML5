// Global variables
let editor;
let currentFile = null;
let originalContent = '';
let fileList = [];

// Function to hide welcome screen
function hideWelcomeScreen() {
    const welcomeScreen = document.getElementById('welcomeScreen');
    if (welcomeScreen) {
        welcomeScreen.classList.add('hidden');
        console.log('Welcome screen hidden');
    }
}

// Setup resizer functionality
function setupResizer() {
    const resizer = document.getElementById('resizer');
    const demoSection = document.querySelector('.demo-section');
    const codeSection = document.querySelector('.code-section');
    const contentArea = document.querySelector('.content-area');
    
    let isResizing = false;
    
    resizer.addEventListener('mousedown', function(e) {
        isResizing = true;
        resizer.classList.add('resizing');
        document.body.style.cursor = 'ns-resize';
        document.body.style.userSelect = 'none';
        
        const startY = e.clientY;
        const startDemoHeight = demoSection.offsetHeight;
        const totalHeight = contentArea.offsetHeight - resizer.offsetHeight;
        
        function handleMouseMove(e) {
            if (!isResizing) return;
            
            const deltaY = e.clientY - startY;
            const newDemoHeight = startDemoHeight + deltaY;
            const minHeight = 200;
            const maxHeight = totalHeight - minHeight;
            
            if (newDemoHeight >= minHeight && newDemoHeight <= maxHeight) {
                const demoPercent = (newDemoHeight / totalHeight) * 100;
                const codePercent = 100 - demoPercent;
                
                demoSection.style.flex = `0 0 ${demoPercent}%`;
                codeSection.style.flex = `0 0 ${codePercent}%`;
                
                // Trigger Monaco editor resize
                if (editor) {
                    setTimeout(() => editor.layout(), 100);
                }
            }
        }
        
        function handleMouseUp() {
            isResizing = false;
            resizer.classList.remove('resizing');
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        }
        
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        
        e.preventDefault();
    });
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeMonacoEditor();
    loadFileList();
    setupEventListeners();
});

// Initialize Monaco Editor
function initializeMonacoEditor() {
    require.config({ paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.39.0/min/vs' } });
    
    require(['vs/editor/editor.main'], function() {
        // Configure HTML language features
        monaco.languages.html.htmlDefaults.setOptions({
            format: {
                tabSize: 2,
                insertSpaces: true,
                wrapLineLength: 120,
                unformatted: 'default'
            },
            suggest: {
                html5: true,
                angular1: false,
                ionic: false
            }
        });

        editor = monaco.editor.create(document.getElementById('editor'), {
            value: '<!-- Select a file from the sidebar to start editing -->\n<!-- Your changes will be reflected in real-time -->',
            language: 'html',
            theme: 'vs',
            automaticLayout: true,
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            wordWrap: 'on',
            scrollBeyondLastLine: false,
            folding: true,
            renderWhitespace: 'selection',
            // Enhanced autocomplete settings
            quickSuggestions: {
                other: true,
                comments: false,
                strings: true
            },
            parameterHints: {
                enabled: true
            },
            autoClosingTags: true,
            autoClosingBrackets: 'always',
            autoClosingQuotes: 'always',
            autoIndent: 'full',
            formatOnPaste: true,
            formatOnType: true,
            suggestOnTriggerCharacters: true,
            acceptSuggestionOnEnter: 'on',
            tabCompletion: 'on',
            wordBasedSuggestions: true,
            // Enhanced auto-closing features
            autoClosingPairs: [
                { open: '<', close: '>' },
                { open: '"', close: '"' },
                { open: "'", close: "'" },
                { open: '(', close: ')' },
                { open: '[', close: ']' },
                { open: '{', close: '}' }
            ],
            autoSurroundingPairs: [
                { open: '<', close: '>' },
                { open: '"', close: '"' },
                { open: "'", close: "'" },
                { open: '(', close: ')' },
                { open: '[', close: ']' },
                { open: '{', close: '}' }
            ],
            // IntelliSense settings
            hover: {
                enabled: true
            },
            lightbulb: {
                enabled: true
            }
        });

        // Register custom HTML snippets with auto-closing tags
        monaco.languages.registerCompletionItemProvider('html', {
            provideCompletionItems: function(model, position) {
                const suggestions = [
                    {
                        label: 'html5-template',
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: [
                            '<!DOCTYPE html>',
                            '<html lang="en">',
                            '<head>',
                            '    <meta charset="UTF-8">',
                            '    <meta name="viewport" content="width=device-width, initial-scale=1.0">',
                            '    <title>${1:Document}</title>',
                            '</head>',
                            '<body>',
                            '    ${2:<!-- Your content here -->}',
                            '</body>',
                            '</html>'
                        ].join('\n'),
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        documentation: 'HTML5 Document Template'
                    },
                    {
                        label: 'div',
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: '<div${1: class="${2:container}"}>${3:Content}</div>',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        documentation: 'Div element with auto-closing tag'
                    },
                    {
                        label: 'p',
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: '<p${1: class="${2:text}"}>${3:Paragraph text}</p>',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        documentation: 'Paragraph element with auto-closing tag'
                    },
                    {
                        label: 'span',
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: '<span${1: class="${2:highlight}"}>${3:Text}</span>',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        documentation: 'Span element with auto-closing tag'
                    },
                    {
                        label: 'h1',
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: '<h1${1: class="${2:title}"}>${3:Heading 1}</h1>',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        documentation: 'H1 heading with auto-closing tag'
                    },
                    {
                        label: 'h2',
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: '<h2${1: class="${2:subtitle}"}>${3:Heading 2}</h2>',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        documentation: 'H2 heading with auto-closing tag'
                    },
                    {
                        label: 'h3',
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: '<h3${1: class="${2:section-title}"}>${3:Heading 3}</h3>',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        documentation: 'H3 heading with auto-closing tag'
                    },
                    {
                        label: 'ul',
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: [
                            '<ul${1: class="${2:list}"}>', 
                            '    <li>${3:Item 1}</li>',
                            '    <li>${4:Item 2}</li>',
                            '    <li>${5:Item 3}</li>',
                            '</ul>'
                        ].join('\n'),
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        documentation: 'Unordered list with items'
                    },
                    {
                        label: 'ol',
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: [
                            '<ol${1: class="${2:numbered-list}"}>', 
                            '    <li>${3:Item 1}</li>',
                            '    <li>${4:Item 2}</li>',
                            '    <li>${5:Item 3}</li>',
                            '</ol>'
                        ].join('\n'),
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        documentation: 'Ordered list with items'
                    },
                    {
                        label: 'li',
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: '<li${1: class="${2:item}"}>${3:List item}</li>',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        documentation: 'List item with auto-closing tag'
                    },
                    {
                        label: 'a',
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: '<a href="${1:#}" ${2:class="${3:link}"}>${4:Link text}</a>',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        documentation: 'Anchor link with auto-closing tag'
                    },
                    {
                        label: 'img',
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: '<img src="${1:image.jpg}" alt="${2:Description}" ${3:class="${4:image}"}${5: width="${6:300}"}>',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        documentation: 'Image element (self-closing)'
                    },
                    {
                        label: 'table',
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: [
                            '<table${1: class="${2:table}"}>', 
                            '    <thead>',
                            '        <tr>',
                            '            <th>${3:Header 1}</th>',
                            '            <th>${4:Header 2}</th>',
                            '        </tr>',
                            '    </thead>',
                            '    <tbody>',
                            '        <tr>',
                            '            <td>${5:Data 1}</td>',
                            '            <td>${6:Data 2}</td>',
                            '        </tr>',
                            '    </tbody>',
                            '</table>'
                        ].join('\n'),
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        documentation: 'Table with headers and body'
                    },
                    {
                        label: 'btn',
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: '<button type="${1:button}" class="${2:btn}">${3:Click me}</button>',
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        documentation: 'Button element with type and class'
                    },
                    {
                        label: 'form-input',
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: [
                            '<div class="form-group">',
                            '    <label for="${1:inputId}">${2:Label}</label>',
                            '    <input type="${3:text}" id="${1:inputId}" name="${4:inputName}" placeholder="${5:Enter text}">',
                            '</div>'
                        ].join('\n'),
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        documentation: 'Form input with label'
                    },
                    {
                        label: 'card',
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: [
                            '<div class="card">',
                            '    <div class="card-header">',
                            '        <h3>${1:Card Title}</h3>',
                            '    </div>',
                            '    <div class="card-body">',
                            '        <p>${2:Card content goes here}</p>',
                            '    </div>',
                            '</div>'
                        ].join('\n'),
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        documentation: 'Card component'
                    },
                    {
                        label: 'nav',
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: [
                            '<nav class="navbar">',
                            '    <ul class="nav-list">',
                            '        <li class="nav-item"><a href="${1:#}" class="nav-link">${2:Home}</a></li>',
                            '        <li class="nav-item"><a href="${3:#}" class="nav-link">${4:About}</a></li>',
                            '        <li class="nav-item"><a href="${5:#}" class="nav-link">${6:Contact}</a></li>',
                            '    </ul>',
                            '</nav>'
                        ].join('\n'),
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        documentation: 'Navigation bar'
                    },
                    {
                        label: 'grid',
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: [
                            '<div class="grid-container">',
                            '    <div class="grid-item">${1:Item 1}</div>',
                            '    <div class="grid-item">${2:Item 2}</div>',
                            '    <div class="grid-item">${3:Item 3}</div>',
                            '</div>'
                        ].join('\n'),
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        documentation: 'CSS Grid container'
                    },
                    {
                        label: 'flex',
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: [
                            '<div class="flex-container">',
                            '    <div class="flex-item">${1:Item 1}</div>',
                            '    <div class="flex-item">${2:Item 2}</div>',
                            '    <div class="flex-item">${3:Item 3}</div>',
                            '</div>'
                        ].join('\n'),
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        documentation: 'Flexbox container'
                    }
                ];
                return { suggestions: suggestions };
            }
        });

        // Register CSS snippets
        monaco.languages.registerCompletionItemProvider('css', {
            provideCompletionItems: function(model, position) {
                const suggestions = [
                    {
                        label: 'flexbox',
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: [
                            'display: flex;',
                            'justify-content: ${1:center};',
                            'align-items: ${2:center};',
                            'flex-direction: ${3:row};'
                        ].join('\n'),
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        documentation: 'Flexbox container properties'
                    },
                    {
                        label: 'grid',
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: [
                            'display: grid;',
                            'grid-template-columns: ${1:repeat(3, 1fr)};',
                            'grid-gap: ${2:20px};'
                        ].join('\n'),
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        documentation: 'CSS Grid container'
                    },
                    {
                        label: 'center',
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: [
                            'position: absolute;',
                            'top: 50%;',
                            'left: 50%;',
                            'transform: translate(-50%, -50%);'
                        ].join('\n'),
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        documentation: 'Center element absolutely'
                    },
                    {
                        label: 'button-style',
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: [
                            'padding: ${1:10px 20px};',
                            'border: none;',
                            'border-radius: ${2:5px};',
                            'background: ${3:#007bff};',
                            'color: white;',
                            'cursor: pointer;',
                            'transition: all 0.3s ease;'
                        ].join('\n'),
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        documentation: 'Button styling'
                    },
                    {
                        label: 'card-shadow',
                        kind: monaco.languages.CompletionItemKind.Snippet,
                        insertText: [
                            'box-shadow: 0 ${1:4px} ${2:8px} rgba(0, 0, 0, ${3:0.1});',
                            'border-radius: ${4:8px};',
                            'background: white;',
                            'padding: ${5:20px};'
                        ].join('\n'),
                        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        documentation: 'Card with shadow effect'
                    }
                ];
                return { suggestions: suggestions };
            }
        });

        // Add keyboard shortcuts
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, function() {
            applyChanges();
        });
        
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyR, function() {
            resetChanges();
        });

        editor.addCommand(monaco.KeyCode.F5, function() {
            updatePreview();
        });

        // Enhanced auto-closing tag behavior
        editor.onDidType(function(text) {
            if (text === '>') {
                const position = editor.getPosition();
                const model = editor.getModel();
                const lineContent = model.getLineContent(position.lineNumber);
                const beforeCursor = lineContent.substring(0, position.column - 1);
                
                // Check if we just typed a closing >
                const tagMatch = beforeCursor.match(/<(\w+)(?:\s[^>]*)?$/);
                if (tagMatch) {
                    const tagName = tagMatch[1].toLowerCase();
                    // List of self-closing tags that don't need closing tags
                    const selfClosingTags = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr'];
                    
                    if (!selfClosingTags.includes(tagName)) {
                        // Insert closing tag and position cursor
                        const edit = {
                            range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column),
                            text: `</${tagName}>`
                        };
                        
                        model.pushEditOperations([], [edit], () => null);
                        
                        // Position cursor between opening and closing tags
                        editor.setPosition({
                            lineNumber: position.lineNumber,
                            column: position.column
                        });
                    }
                }
            }
        });

        // Setup real-time preview
        editor.onDidChangeModelContent(function() {
            if (currentFile) {
                debounce(updatePreview, 500)();
            }
        });
    });
}

// Load file list from the repository
async function loadFileList() {
    try {
        // Define the HTML files in the repository
        const htmlFiles = [
            '3d_button.html',
            'anchor.html', 
            'button.html',
            'css_grid.html',
            'div1.html',
            'div2.html',
            'font_family.html',
            'formatting.html',
            'headings.html',
            'img.html',
            'inline_alignment.html',
            'List.html',
            'mail.html',
            'psudo_classes.html',
            'table.html',
            'text.html',
            'text2.html'
        ];

        fileList = htmlFiles;
        renderFileList();
    } catch (error) {
        console.error('Error loading file list:', error);
        showError('Failed to load file list');
    }
}

// Render file list in sidebar
function renderFileList() {
    const fileListContainer = document.getElementById('fileList');
    fileListContainer.innerHTML = '';

    fileList.forEach(filename => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.textContent = filename;
        fileItem.addEventListener('click', () => loadFile(filename));
        fileListContainer.appendChild(fileItem);
    });
}

// Load and display a file
async function loadFile(filename) {
    try {
        // Show loading state
        const demoFrame = document.getElementById('demoFrame');
        const editorContainer = document.getElementById('editor');
        
        // Hide welcome screen
        document.getElementById('welcomeScreen').classList.add('hidden');
        
        // Update active file in sidebar
        document.querySelectorAll('.file-item').forEach(item => {
            item.classList.remove('active');
            if (item.textContent === filename) {
                item.classList.add('active');
            }
        });

        // Fetch file content
        const response = await fetch(`../${filename}`);
        if (!response.ok) {
            throw new Error(`Failed to load ${filename}`);
        }
        
        const content = await response.text();
        
        // Detect file language
        let language = 'html';
        if (filename.endsWith('.css')) {
            language = 'css';
        } else if (filename.endsWith('.js')) {
            language = 'javascript';
        } else if (filename.endsWith('.json')) {
            language = 'json';
        }

        // Update editor
        if (editor) {
            editor.setValue(content);
            monaco.editor.setModelLanguage(editor.getModel(), language);
            originalContent = content;
            currentFile = filename;
        }

        // Update preview
        updatePreview();
        
    } catch (error) {
        console.error('Error loading file:', error);
        showError(`Failed to load ${filename}`);
    }
}

// Update live preview
function updatePreview() {
    if (!editor || !currentFile) return;

    const content = editor.getValue();
    const demoFrame = document.getElementById('demoFrame');
    
    // Create a blob URL for the HTML content
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    // Update iframe source
    demoFrame.src = url;
    
    // Clean up previous blob URL
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Setup event listeners
function setupEventListeners() {
    // Refresh button
    document.getElementById('refreshBtn').addEventListener('click', updatePreview);
    
    // Fullscreen button
    document.getElementById('fullscreenBtn').addEventListener('click', toggleFullscreen);
    
    // Save button (apply changes)
    document.getElementById('saveBtn').addEventListener('click', applyChanges);
    
    // Reset button
    document.getElementById('resetBtn').addEventListener('click', resetChanges);
    
    // Close welcome screen button
    const closeBtn = document.getElementById('closeWelcome');
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            console.log('Close button clicked'); // Debug log
            document.getElementById('welcomeScreen').classList.add('hidden');
        });
    }
    
    // ESC key to close welcome screen
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            document.getElementById('welcomeScreen').classList.add('hidden');
        }
    });
    
    // Setup resizer functionality
    setupResizer();
}

// Toggle fullscreen for demo
function toggleFullscreen() {
    const demoFrame = document.getElementById('demoFrame');
    const demoContainer = demoFrame.parentElement;
    
    if (!document.fullscreenElement) {
        demoContainer.requestFullscreen().then(() => {
            document.getElementById('fullscreenBtn').textContent = 'Exit Fullscreen';
        }).catch(err => {
            console.error('Error entering fullscreen:', err);
        });
    } else {
        document.exitFullscreen().then(() => {
            document.getElementById('fullscreenBtn').textContent = 'Fullscreen';
        });
    }
}

// Apply changes (this would save to server in a real implementation)
function applyChanges() {
    if (!editor || !currentFile) return;
    
    const content = editor.getValue();
    showSuccess('Changes applied! (Note: This is a demo - changes are not saved permanently)');
    originalContent = content;
}

// Reset changes
function resetChanges() {
    if (!editor || !currentFile) return;
    
    editor.setValue(originalContent);
    updatePreview();
    showInfo('Code reset to original version');
}

// Utility function for debouncing
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Show success message
function showSuccess(message) {
    showToast(message, 'success');
}

// Show error message
function showError(message) {
    showToast(message, 'error');
}

// Show info message
function showInfo(message) {
    showToast(message, 'info');
}

// Show toast notification
function showToast(message, type = 'info') {
    // Remove existing toasts
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    
    // Add styles
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 24px;
        border-radius: 6px;
        color: white;
        font-weight: 500;
        z-index: 2000;
        animation: slideIn 0.3s ease;
        max-width: 400px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    `;
    
    // Set background color based on type
    const colors = {
        success: '#27ae60',
        error: '#e74c3c',
        info: '#3498db'
    };
    toast.style.backgroundColor = colors[type] || colors.info;
    
    // Add animation keyframes
    if (!document.querySelector('#toast-styles')) {
        const style = document.createElement('style');
        style.id = 'toast-styles';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    // Add to DOM
    document.body.appendChild(toast);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
    
    // Click to dismiss
    toast.addEventListener('click', () => {
        toast.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    });
}

// Handle fullscreen change
document.addEventListener('fullscreenchange', function() {
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    if (document.fullscreenElement) {
        fullscreenBtn.textContent = 'Exit Fullscreen';
    } else {
        fullscreenBtn.textContent = 'Fullscreen';
    }
});

// Error handling for iframe loading
window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
});

// Initialize smooth scrolling
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + S to apply changes
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        applyChanges();
    }
    
    // Ctrl/Cmd + R to refresh preview
    if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        updatePreview();
    }
    
    // Ctrl/Cmd + Z to reset (override default undo)
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'Z') {
        e.preventDefault();
        resetChanges();
    }
});

console.log('HTML5 Demo Site initialized successfully!');