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
            renderWhitespace: 'selection'
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
        
        // Update editor
        if (editor) {
            editor.setValue(content);
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