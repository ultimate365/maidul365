"use client"
import React, { useState, useRef } from 'react';
import Editor from '@monaco-editor/react';

const ReactToReactNativeConverter = () => {
  const [inputCode, setInputCode] = useState('');
  const [outputCode, setOutputCode] = useState('');
  const [fileName, setFileName] = useState('');
  const [isConverting, setIsConverting] = useState(false);
  const [conversionStats, setConversionStats] = useState({});
  const fileInputRef = useRef(null);

  // Tailwind to React Native Style mappings
  const tailwindToRNStyle = {
    // Layout
    'flex': { display: 'flex' },
    'hidden': { display: 'none' },
    'flex-1': { flex: 1 },
    'flex-row': { flexDirection: 'row' },
    'flex-col': { flexDirection: 'column' },
    'flex-wrap': { flexWrap: 'wrap' },
    
    // Justify Content
    'justify-start': { justifyContent: 'flex-start' },
    'justify-end': { justifyContent: 'flex-end' },
    'justify-center': { justifyContent: 'center' },
    'justify-between': { justifyContent: 'space-between' },
    'justify-around': { justifyContent: 'space-around' },
    
    // Align Items
    'items-start': { alignItems: 'flex-start' },
    'items-end': { alignItems: 'flex-end' },
    'items-center': { alignItems: 'center' },
    'items-baseline': { alignItems: 'baseline' },
    'items-stretch': { alignItems: 'stretch' },
    
    // Spacing (Margin)
    'm-1': { margin: 4 },
    'm-2': { margin: 8 },
    'm-3': { margin: 12 },
    'm-4': { margin: 16 },
    'm-5': { margin: 20 },
    'mx-1': { marginHorizontal: 4 },
    'mx-2': { marginHorizontal: 8 },
    'mx-3': { marginHorizontal: 12 },
    'mx-4': { marginHorizontal: 16 },
    'mx-5': { marginHorizontal: 20 },
    'my-1': { marginVertical: 4 },
    'my-2': { marginVertical: 8 },
    'my-3': { marginVertical: 12 },
    'my-4': { marginVertical: 16 },
    'my-5': { marginVertical: 20 },
    'mt-1': { marginTop: 4 },
    'mt-2': { marginTop: 8 },
    'mt-3': { marginTop: 12 },
    'mt-4': { marginTop: 16 },
    'mt-5': { marginTop: 20 },
    'mb-1': { marginBottom: 4 },
    'mb-2': { marginBottom: 8 },
    'mb-3': { marginBottom: 12 },
    'mb-4': { marginBottom: 16 },
    'mb-5': { marginBottom: 20 },
    'ml-1': { marginLeft: 4 },
    'ml-2': { marginLeft: 8 },
    'ml-3': { marginLeft: 12 },
    'ml-4': { marginLeft: 16 },
    'ml-5': { marginLeft: 20 },
    'mr-1': { marginRight: 4 },
    'mr-2': { marginRight: 8 },
    'mr-3': { marginRight: 12 },
    'mr-4': { marginRight: 16 },
    'mr-5': { marginRight: 20 },
    
    // Spacing (Padding)
    'p-1': { padding: 4 },
    'p-2': { padding: 8 },
    'p-3': { padding: 12 },
    'p-4': { padding: 16 },
    'p-5': { padding: 20 },
    'px-1': { paddingHorizontal: 4 },
    'px-2': { paddingHorizontal: 8 },
    'px-3': { paddingHorizontal: 12 },
    'px-4': { paddingHorizontal: 16 },
    'px-5': { paddingHorizontal: 20 },
    'py-1': { paddingVertical: 4 },
    'py-2': { paddingVertical: 8 },
    'py-3': { paddingVertical: 12 },
    'py-4': { paddingVertical: 16 },
    'py-5': { paddingVertical: 20 },
    
    // Colors
    'bg-blue-500': { backgroundColor: '#3b82f6' },
    'bg-blue-600': { backgroundColor: '#2563eb' },
    'bg-gray-500': { backgroundColor: '#6b7280' },
    'bg-gray-600': { backgroundColor: '#4b5563' },
    'bg-red-500': { backgroundColor: '#ef4444' },
    'bg-green-500': { backgroundColor: '#10b981' },
    'bg-yellow-500': { backgroundColor: '#f59e0b' },
    'bg-purple-500': { backgroundColor: '#8b5cf6' },
    'bg-white': { backgroundColor: '#ffffff' },
    'bg-black': { backgroundColor: '#000000' },
    
    // Text
    'text-white': { color: '#ffffff' },
    'text-black': { color: '#000000' },
    'text-blue-500': { color: '#3b82f6' },
    'text-center': { textAlign: 'center' },
    'text-left': { textAlign: 'left' },
    'text-right': { textAlign: 'right' },
    'text-sm': { fontSize: 14 },
    'text-base': { fontSize: 16 },
    'text-lg': { fontSize: 18 },
    'text-xl': { fontSize: 20 },
    'font-bold': { fontWeight: 'bold' },
    'font-normal': { fontWeight: 'normal' },
    
    // Borders
    'border': { borderWidth: 1, borderColor: '#d1d5db' },
    'rounded': { borderRadius: 4 },
    'rounded-lg': { borderRadius: 8 },
    'rounded-full': { borderRadius: 9999 },
    
    // Sizing
    'w-full': { width: '100%' },
    'h-full': { height: '100%' },
    'w-screen': { width: '100%' },
    'h-screen': { height: '100%' },
  };

  // Bootstrap to React Native Style mappings
  const bootstrapToRNStyle = {
    // Layout
    'd-flex': { display: 'flex' },
    'd-none': { display: 'none' },
    'flex-row': { flexDirection: 'row' },
    'flex-column': { flexDirection: 'column' },
    
    // Justify Content
    'justify-content-start': { justifyContent: 'flex-start' },
    'justify-content-end': { justifyContent: 'flex-end' },
    'justify-content-center': { justifyContent: 'center' },
    'justify-content-between': { justifyContent: 'space-between' },
    'justify-content-around': { justifyContent: 'space-around' },
    
    // Align Items
    'align-items-start': { alignItems: 'flex-start' },
    'align-items-end': { alignItems: 'flex-end' },
    'align-items-center': { alignItems: 'center' },
    'align-items-baseline': { alignItems: 'baseline' },
    'align-items-stretch': { alignItems: 'stretch' },
    
    // Spacing
    'm-1': { margin: 4 },
    'm-2': { margin: 8 },
    'm-3': { margin: 16 },
    'm-4': { margin: 24 },
    'm-5': { margin: 48 },
    'p-1': { padding: 4 },
    'p-2': { padding: 8 },
    'p-3': { padding: 16 },
    'p-4': { padding: 24 },
    'p-5': { padding: 48 },
    
    // Colors
    'bg-primary': { backgroundColor: '#007bff' },
    'bg-secondary': { backgroundColor: '#6c757d' },
    'bg-success': { backgroundColor: '#28a745' },
    'bg-danger': { backgroundColor: '#dc3545' },
    'bg-warning': { backgroundColor: '#ffc107' },
    'bg-info': { backgroundColor: '#17a2b8' },
    'bg-light': { backgroundColor: '#f8f9fa' },
    'bg-dark': { backgroundColor: '#343a40' },
    
    // Text
    'text-white': { color: '#ffffff' },
    'text-dark': { color: '#343a40' },
    'text-center': { textAlign: 'center' },
    'text-left': { textAlign: 'left' },
    'text-right': { textAlign: 'right' },
    
    // Borders
    'border': { borderWidth: 1, borderColor: '#dee2e6' },
    'rounded': { borderRadius: 4 },
    'rounded-lg': { borderRadius: 8 },
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && (file.name.endsWith('.jsx') || file.name.endsWith('.tsx'))) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        setInputCode(content);
        convertCode(content);
      };
      reader.readAsText(file);
    } else {
      alert('Please upload a .jsx or .tsx file');
    }
  };

  const convertClassNameToStyle = (classNameString) => {
    const classes = classNameString.split(' ').filter(cls => cls.trim());
    const styleObject = {};
    let hasTailwind = false;
    let hasBootstrap = false;
    const unconvertedClasses = [];

    classes.forEach(className => {
      // Check for Tailwind classes
      if (tailwindToRNStyle[className]) {
        Object.assign(styleObject, tailwindToRNStyle[className]);
        hasTailwind = true;
      } 
      // Check for Bootstrap classes
      else if (bootstrapToRNStyle[className]) {
        Object.assign(styleObject, bootstrapToRNStyle[className]);
        hasBootstrap = true;
      }
      // Check for responsive classes (like md:, sm:)
      else if (className.includes(':')) {
        const [breakpoint, actualClass] = className.split(':');
        if (tailwindToRNStyle[actualClass]) {
          Object.assign(styleObject, tailwindToRNStyle[actualClass]);
          hasTailwind = true;
        } else {
          unconvertedClasses.push(className);
        }
      }
      else {
        unconvertedClasses.push(className);
      }
    });

    return {
      styleObject,
      hasTailwind,
      hasBootstrap,
      unconvertedClasses
    };
  };

  const convertCode = async (code = inputCode) => {
    if (!code.trim()) return;
    
    setIsConverting(true);
    setConversionStats({});
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    let convertedCode = code;
    const stats = {
      tailwindClasses: 0,
      bootstrapClasses: 0,
      unconvertedClasses: 0,
      componentsConverted: 0
    };

    // Component conversion rules
    const componentRules = [
      { regex: /<div\b([^>]*)>/g, replacement: '<View$1>' },
      { regex: /<\/div>/g, replacement: '</View>' },
      { regex: /<span\b([^>]*)>/g, replacement: '<Text$1>' },
      { regex: /<\/span>/g, replacement: '</Text>' },
      { regex: /<p\b([^>]*)>/g, replacement: '<Text$1>' },
      { regex: /<\/p>/g, replacement: '</Text>' },
      { regex: /<button\b([^>]*)>/g, replacement: '<TouchableOpacity$1>' },
      { regex: /<\/button>/g, replacement: '</TouchableOpacity>' },
      { regex: /<input\b([^>]*)>/g, replacement: '<TextInput$1>' },
      { regex: /<img\b([^>]*)>/g, replacement: '<Image$1>' },
      { regex: /<ul\b([^>]*)>/g, replacement: '<View$1>' },
      { regex: /<\/ul>/g, replacement: '</View>' },
      { regex: /<ol\b([^>]*)>/g, replacement: '<View$1>' },
      { regex: /<\/ol>/g, replacement: '</View>' },
      { regex: /<li\b([^>]*)>/g, replacement: '<Text$1>' },
      { regex: /<\/li>/g, replacement: '</Text>' },
      { regex: /<a\b([^>]*)>/g, replacement: '<TouchableOpacity$1>' },
      { regex: /<\/a>/g, replacement: '</TouchableOpacity>' },
      
      // Event handlers
      { regex: /onClick=/g, replacement: 'onPress=' },
      { regex: /onChange=/g, replacement: 'onChangeText=' },
    ];

    // Apply component conversions
    componentRules.forEach(rule => {
      const matches = convertedCode.match(rule.regex);
      if (matches) stats.componentsConverted += matches.length;
      convertedCode = convertedCode.replace(rule.regex, rule.replacement);
    });

    // Convert class names to styles
    const classRegex = /(className|class)=["']([^"']+)["']/g;
    let match;
    const styleReplacements = [];

    while ((match = classRegex.exec(convertedCode)) !== null) {
      const fullMatch = match[0];
      const classes = match[2];
      
      const conversion = convertClassNameToStyle(classes);
      
      if (conversion.hasTailwind) stats.tailwindClasses++;
      if (conversion.hasBootstrap) stats.bootstrapClasses++;
      if (conversion.unconvertedClasses.length > 0) {
        stats.unconvertedClasses += conversion.unconvertedClasses.length;
      }

      if (Object.keys(conversion.styleObject).length > 0) {
        let replacement = `style={${JSON.stringify(conversion.styleObject, null, 2)
          .replace(/"([^"]+)":/g, '$1:')
          .replace(/\n/g, '\n  ')}}`;
        
        if (conversion.unconvertedClasses.length > 0) {
          // Add comment for unconverted classes
          replacement += ` // Unconverted classes: ${conversion.unconvertedClasses.join(', ')}`;
        }
        
        styleReplacements.push({ fullMatch, replacement });
      } else if (conversion.unconvertedClasses.length > 0) {
        // If no styles were converted but there are unconverted classes, add a comment
        const replacement = `${fullMatch} // Unconverted classes: ${conversion.unconvertedClasses.join(', ')}`;
        styleReplacements.push({ fullMatch, replacement });
      }
    }

    // Apply style replacements in reverse to avoid index issues
    styleReplacements.reverse().forEach(({ fullMatch, replacement }) => {
      convertedCode = convertedCode.replace(fullMatch, replacement);
    });

    // Add React Native imports
    const componentsToImport = [];
    if (convertedCode.includes('<View') || convertedCode.includes('</View>')) {
      componentsToImport.push('View');
    }
    if (convertedCode.includes('<Text') || convertedCode.includes('</Text>')) {
      componentsToImport.push('Text');
    }
    if (convertedCode.includes('<TouchableOpacity') || convertedCode.includes('</TouchableOpacity>')) {
      componentsToImport.push('TouchableOpacity');
    }
    if (convertedCode.includes('<TextInput')) {
      componentsToImport.push('TextInput');
    }
    if (convertedCode.includes('<Image')) {
      componentsToImport.push('Image');
    }
    if (convertedCode.includes('<ScrollView') || convertedCode.includes('</ScrollView>')) {
      componentsToImport.push('ScrollView');
    }

    if (componentsToImport.length > 0 && !convertedCode.includes("from 'react-native'")) {
      const importStatement = `import { ${componentsToImport.join(', ')} } from 'react-native';\n`;
      
      const importRegex = /import\s+.*?from\s+['"'][^'"]+['"'];?\s*\n/g;
      const matches = convertedCode.match(importRegex);
      
      if (matches) {
        const lastImport = matches[matches.length - 1];
        const lastImportIndex = convertedCode.lastIndexOf(lastImport) + lastImport.length;
        convertedCode = convertedCode.slice(0, lastImportIndex) + '\n' + importStatement + convertedCode.slice(lastImportIndex);
      } else {
        convertedCode = importStatement + '\n' + convertedCode;
      }
    }

    // Add StyleSheet if styles are present
    if (convertedCode.includes('style={') && !convertedCode.includes('StyleSheet')) {
      const importIndex = convertedCode.indexOf("from 'react-native'");
      if (importIndex !== -1) {
        convertedCode = convertedCode.replace(
          "from 'react-native'",
          `, StyleSheet from 'react-native'`
        );
      }
    }

    setOutputCode(convertedCode);
    setConversionStats(stats);
    setIsConverting(false);
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(outputCode);
      alert('Code copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy code: ', err);
    }
  };

  const handleDownloadCode = () => {
    const element = document.createElement('a');
    const file = new Blob([outputCode], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = fileName ? `converted-${fileName}` : 'converted-react-native.jsx';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleClear = () => {
    setInputCode('');
    setOutputCode('');
    setFileName('');
    setConversionStats({});
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRegenerate = () => {
    if (inputCode) {
      convertCode(inputCode);
    }
  };

  const editorOptions = {
    minimap: { enabled: false },
    fontSize: 14,
    wordWrap: 'on',
    scrollBeyondLastLine: false,
    automaticLayout: true,
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-2">
            React.js to React Native Converter
          </h1>
          <p className="text-gray-400">
            Convert React.js components with Bootstrap/Tailwind CSS to React Native
          </p>
        </header>

        {/* File Upload Section */}
        <div className="mb-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <label className="block text-lg font-semibold">
              Upload JSX/TSX File
            </label>
            <span className="text-sm text-gray-400 bg-gray-700 px-2 py-1 rounded">
              Supports Bootstrap & Tailwind CSS
            </span>
          </div>
          <input
            type="file"
            accept=".jsx,.tsx"
            onChange={handleFileUpload}
            ref={fileInputRef}
            className="w-full p-3 bg-gray-700 border-2 border-dashed border-gray-600 rounded-lg focus:border-blue-400 focus:ring-2 focus:ring-blue-400 transition-colors"
          />
          {fileName && (
            <div className="mt-3 flex items-center text-green-400">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              File loaded: {fileName}
            </div>
          )}
        </div>

        {/* Conversion Stats */}
        {Object.keys(conversionStats).length > 0 && (
          <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-900/50 p-4 rounded-lg border border-blue-700">
              <div className="text-2xl font-bold text-blue-400">{conversionStats.tailwindClasses || 0}</div>
              <div className="text-sm text-blue-300">Tailwind Classes</div>
            </div>
            <div className="bg-purple-900/50 p-4 rounded-lg border border-purple-700">
              <div className="text-2xl font-bold text-purple-400">{conversionStats.bootstrapClasses || 0}</div>
              <div className="text-sm text-purple-300">Bootstrap Classes</div>
            </div>
            <div className="bg-green-900/50 p-4 rounded-lg border border-green-700">
              <div className="text-2xl font-bold text-green-400">{conversionStats.componentsConverted || 0}</div>
              <div className="text-sm text-green-300">Components Converted</div>
            </div>
            <div className="bg-yellow-900/50 p-4 rounded-lg border border-yellow-700">
              <div className="text-2xl font-bold text-yellow-400">{conversionStats.unconvertedClasses || 0}</div>
              <div className="text-sm text-yellow-300">Unconverted Classes</div>
            </div>
          </div>
        )}

        {/* Code Editors Section */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
          {/* Input Editor */}
          <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
            <div className="bg-gray-750 px-4 py-3 flex justify-between items-center border-b border-gray-700">
              <h3 className="font-semibold text-lg flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
                Input React.js Code
              </h3>
              <span className="text-xs bg-blue-500 px-3 py-1 rounded-full font-mono">JSX/TSX</span>
            </div>
            <div className="h-96">
              <Editor
                height="100%"
                defaultLanguage="javascript"
                value={inputCode}
                onChange={setInputCode}
                theme="vs-dark"
                options={editorOptions}
                loading={
                  <div className="flex items-center justify-center h-full bg-gray-900">
                    <div className="text-blue-400">Loading Editor...</div>
                  </div>
                }
              />
            </div>
          </div>

          {/* Output Editor */}
          <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
            <div className="bg-gray-750 px-4 py-3 flex justify-between items-center border-b border-gray-700">
              <h3 className="font-semibold text-lg flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Output React Native Code
                {isConverting && (
                  <span className="ml-2 px-2 py-1 text-xs bg-yellow-500 text-black rounded-full animate-pulse">
                    Converting...
                  </span>
                )}
              </h3>
              <span className="text-xs bg-green-500 px-3 py-1 rounded-full font-mono">React Native</span>
            </div>
            <div className="h-96">
              <Editor
                height="100%"
                defaultLanguage="javascript"
                value={outputCode}
                theme="vs-dark"
                options={{
                  ...editorOptions,
                  readOnly: true,
                }}
                loading={
                  <div className="flex items-center justify-center h-full bg-gray-900">
                    <div className="text-green-400">Loading Editor...</div>
                  </div>
                }
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 justify-center mb-8">
          <button
            onClick={() => convertCode()}
            disabled={!inputCode || isConverting}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 disabled:scale-100 flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Convert Code
          </button>

          <button
            onClick={handleRegenerate}
            disabled={!inputCode || isConverting}
            className="px-8 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 disabled:cursor-not-allowed rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 disabled:scale-100 flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Regenerate
          </button>

          <button
            onClick={handleCopyCode}
            disabled={!outputCode}
            className="px-8 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 disabled:scale-100 flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copy Code
          </button>

          <button
            onClick={handleDownloadCode}
            disabled={!outputCode}
            className="px-8 py-3 bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-400 disabled:cursor-not-allowed rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 disabled:scale-100 flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download Code
          </button>

          <button
            onClick={handleClear}
            className="px-8 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Clear All
          </button>
        </div>

        {/* CSS Framework Support Info */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-xl font-semibold mb-4 text-blue-400 flex items-center">
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            CSS Framework Support
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-750 p-4 rounded-lg">
              <h4 className="font-semibold mb-3 text-green-400 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Tailwind CSS Support
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-gray-300">Layout & Flexbox</span>
                <span className="text-green-400">✓ Supported</span>
                <span className="text-gray-300">Spacing (m/p)</span>
                <span className="text-green-400">✓ Supported</span>
                <span className="text-gray-300">Colors</span>
                <span className="text-green-400">✓ Supported</span>
                <span className="text-gray-300">Typography</span>
                <span className="text-green-400">✓ Supported</span>
                <span className="text-gray-300">Borders</span>
                <span className="text-green-400">✓ Supported</span>
              </div>
            </div>

            <div className="bg-gray-750 p-4 rounded-lg">
              <h4 className="font-semibold mb-3 text-yellow-400 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Bootstrap Support
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-gray-300">Display & Flex</span>
                <span className="text-green-400">✓ Supported</span>
                <span className="text-gray-300">Spacing Utilities</span>
                <span className="text-green-400">✓ Supported</span>
                <span className="text-gray-300">Color Classes</span>
                <span className="text-green-400">✓ Supported</span>
                <span className="text-gray-300">Text Alignment</span>
                <span className="text-green-400">✓ Supported</span>
                <span className="text-gray-300">Borders</span>
                <span className="text-green-400">✓ Supported</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReactToReactNativeConverter;