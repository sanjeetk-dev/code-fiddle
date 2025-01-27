import React, { useEffect, useState } from 'react';
import AceEditor from 'react-ace';
import Split from 'react-split';
import { Files, Code2, Play, FileDown, Copy, Trash2, Menu, X, Terminal, Maximize2, Minimize2, Settings } from 'lucide-react';
import ace from 'ace-builds';
import 'ace-builds/src-noconflict/mode-html';
import 'ace-builds/src-noconflict/mode-css';
import 'ace-builds/src-noconflict/mode-javascript';
import 'ace-builds/src-noconflict/theme-monokai';
import 'ace-builds/src-noconflict/ext-language_tools';
import type { EditorFile } from '../types';

// Configure Ace editor base path
ace.config.set('basePath', 'https://cdn.jsdelivr.net/npm/ace-builds@1.31.2/src-min-noconflict/');

const DEFAULT_FILES: EditorFile[] = [
  { id: '1', name: 'index.html', language: 'html', content: '<!DOCTYPE html>\n<html>\n  <head>\n    <title>Code Editor</title>\n  </head>\n  <body>\n    <h1>Hello World!</h1>\n  </body>\n</html>' },
  { id: '2', name: 'styles.css', language: 'css', content: 'body {\n  margin: 0;\n  padding: 20px;\n  font-family: Arial, sans-serif;\n}' },
  { id: '3', name: 'script.js', language: 'javascript', content: 'console.log("Hello from JavaScript!");' },
];


export default function Editor() {
  const [files, setFiles] = useState<EditorFile[]>(() => {
    // Load from localStorage or use DEFAULT_FILES
    const storedFiles = localStorage.getItem('editorFiles');
    return storedFiles ? JSON.parse(storedFiles) : DEFAULT_FILES;
  })
  // Save files to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('editorFiles', JSON.stringify(files));
  }, [files]);

  const [settings, setSettings] = useState([
    { name: 'useWordWrap', enabled: true, },
    { name: 'enableBasicAutocompletion', enabled: true, },
    { name: 'enableLiveAutocompletion', enabled: true, },
  ]);

  const [s, setS] = useState({
    useWordWrap: true,
    enableLiveAutocompletion: true,
    enableBasicAutocompletion: true
  })
  const [activeFile, setActiveFile] = useState<EditorFile>(files[0]);
  const [previewContent, setPreviewContent] = useState<string>('');
  const [isFileMenuOpen, setIsFileMenuOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showSetting, setShowSetting] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showConsole, setShowConsole] = useState(false);
  const [consoleOutput, setConsoleOutput] = useState<string[] | null>([]);
  const [editor, setEditor] = useState(null);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setShowPreview(true);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    updatePreview();
  }, [files]);

  const updatePreview = () => {
    clearConsole()
    // setConsoleOutput(null)
    const htmlFile = files.find(f => f.language === 'html')?.content || '';
    const cssFile = files.find(f => f.language === 'css')?.content || '';
    const jsFile = files.find(f => f.language === 'javascript')?.content || '';

    const wrappedJsCode = `
      (function() {
        const originalConsole = console.log;
        console.log = function() {
          const args = Array.from(arguments);
          window.parent.postMessage({
            type: 'console',
            content: args.map(arg => 
              typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
            ).join(' ')
          }, '*');
          originalConsole.apply(console, arguments);
        };
      })();
      ${jsFile}
    `;

    const preview = `
      ${htmlFile}
      <style>${cssFile}</style>
      <script>${wrappedJsCode}</script>
    `;
    setPreviewContent(preview);
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'console') {
        setConsoleOutput(prev => [...prev, event.data.content]);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleCodeChange = (value: string) => {
    const updatedFiles = files.map(file =>
      file.id === activeFile.id ? { ...file, content: value } : file
    );
    setActiveFile({ ...activeFile, content: value });
    clearTimeout(window.localStorageTimeout);
    window.localStorageTimeout = setTimeout(() => {
      setFiles(updatedFiles);
    }, 300);
  };
  const togglePreview = () => {
    if (isMobile) {
      setShowPreview(!showPreview);
    }
  };

  const clearConsole = () => {
    setConsoleOutput([]);
  };

  const handleLoad = (editor: any) => {
    setEditor(editor)
    updateSetting()
  }

  const handleToggleSetting = ({ name }) => {
    setS((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
    console.log(s)
  };

  useEffect(() => {
    updateSetting()
  }, [s])
  const updateSetting = () => {
    console.log(s.useWordWrap)
    if (editor) editor.session.setUseWrapMode(s.useWordWrap);
  };

  const renderEditor = () => (
    <div className="h-full">
      {/*<div className="bg-gray-800 p-2 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          <button className="p-1 hover:bg-gray-700 rounded" title="Save">
            <Copy className="w-4 h-4" />
          </button>
        </div>
      </div>*/}
      <AceEditor
        mode={activeFile.language}
        theme="monokai"
        onChange={handleCodeChange}
        value={activeFile.content}
        name="code-editor"
        width="100%"
        height="100%"
        onLoad={handleLoad}
        fontSize={14}
        showGutter={true}
        highlightActiveLine={true}
        editorProps={{ $blockScrolling: true }}
        setOptions={{
          enableBasicAutocompletion: true,
          enableLiveAutocompletion: true,
          enableSnippets: true,
          showLineNumbers: true,
          tabSize: 2,
          useWorker: false,
          showPrintMargin: false,
          showGutter: true,
          behavioursEnabled: true,
          wrapBehavioursEnabled: true,
          autoScrollEditorIntoView: true,
          copyWithEmptySelection: true,
          displayIndentGuides: true,
          fadeFoldWidgets: true,
          highlightSelectedWord: true,
          mergeUndoDeltas: true,
          animatedScroll: true,
        }}
      />
    </div>
  );

  const renderPreview = () => (
    <div className={`h-screen ${isMobile ? 'absolute inset-0 bg-gray-900' : ''}`}>
      <div className="bg-gray-800 p-2 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Play className="w-4 h-4" />
            <span className="text-sm text-gray-400">Preview</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowConsole(!showConsole)}
              className="p-1 hover:bg-gray-700 rounded"
              title="Toggle Console"
            >
              <Terminal className="w-4 h-4" />
            </button>
            {isMobile && (
              <button
                onClick={() => setShowPreview(false)}
                className="p-1 hover:bg-gray-700 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="relative h-[calc(100%-40px)]">
        <iframe
          title="preview"
          srcDoc={previewContent}
          className="w-full h-full bg-white"
          sandbox="allow-scripts"
        />
        {showConsole && (
          <div className="absolute bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 text-white">
            <div className="flex items-center justify-between p-2 bg-gray-800 border-b border-gray-700">
              <div className="flex items-center space-x-2">
                <Terminal className="w-4 h-4" />
                <span className="text-sm text-gray-400">Console</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={clearConsole}
                  className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 rounded"
                >
                  Clear
                </button>
                <button
                  onClick={() => setShowConsole(false)}
                  className="p-1 hover:bg-gray-700 rounded"
                >
                  <Minimize2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="h-48 overflow-y-auto p-2 font-mono text-sm">
              {consoleOutput.map((output, index) => (
                <div key={index} className="py-1">
                  <span className="text-blue-400">{'>'}</span> {output}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <div className="flex h-10 bg-gray-800 items-center px-4 border-b border-gray-700">
        <Files className="w-5 h-5 mr-2" />
        <div className="flex-1 flex items-center">
          {files.map(file => (
            <button
              key={file.id}
              onClick={() => setActiveFile(file)}
              className={`block px-3 py-1 mr-2 rounded text-sm ${activeFile.id === file.id ? 'bg-blue-600' : 'hover:bg-gray-700'
                }`}
            >
              {file.name}
            </button>
          ))}
        </div>
        <button
          onClick={togglePreview}
          className={`md:hidden p-2 rounded ${showPreview ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
        >
          <Play className="w-4 h-4" />
        </button>
        <button className="p-1 hover:bg-gray-700 rounded" title="Save">
          <Settings className="w-4 h-4"
            onClick={() => {
              setShowSetting((prev) => !prev)
            }}
          />
        </button>
      </div>


      {/* Settings */}
      <div className={`${showSetting ? 'block' : 'hidden'} absolute top-10 right-0 bg-[rgba(0,0,0,0.8)] z-40 h-full w-full overflow-y-auto overflow-y-hidden`}>
        {
          Object.entries(s).map(([key, value]) => (
            <div
              key={key}
              className="flex w-full py-6 px-4 border-b border-gray-400 items-center justify-between"
            >
              <span className="font-bold">
                {key}
              </span>
              <div
                className={`w-10 h-5 flex items-center rounded-full cursor-pointer p-1 ${value ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                onClick={() => handleToggleSetting({ name: key })}
              >
                <div
                  className={`w-4 h-4 bg-white rounded-full shadow-md transform duration-300 ${value ? 'translate-x-4' : 'translate-x-0'
                    }`}
                ></div>
              </div>
            </div>
          ))
        }
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Editor and Preview */}
        <div className="flex-1">
          {isMobile ? (
            <>
              {!showPreview && renderEditor()}
              {showPreview && renderPreview()}
            </>
          ) : (
            <Split
              className="split-horizontal"
              sizes={[50, 50]}
              minSize={300}
              gutterSize={10}
              snapOffset={30}
            >
              {renderEditor()}
              {renderPreview()}
            </Split>
          )}
        </div>
      </div>
    </div>
  );
}