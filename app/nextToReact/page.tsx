"use client";
import React, { ChangeEvent, useState } from "react";
import {
  Container,
  Typography,
  Button,
  Snackbar,
  Alert,
  styled,
  Tooltip,
  Paper,
  createTheme,
  ThemeProvider,
} from "@mui/material";
import { ContentCopy, Download } from "@mui/icons-material";
import Editor from "@monaco-editor/react";
import { CloudUpload } from "@mui/icons-material";

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  textAlign: "center",
  marginBottom: theme.spacing(2),
}));
const darkTheme = createTheme({
  palette: {
    mode: "dark",
  },
});
const StyledButton = styled(Button)(({ theme }) => ({
  margin: theme.spacing(2),
}));

interface FileUploaderProps {
  onFileSelect: (content: string, fileName: string) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFileSelect }) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.match(/\.(jsx|tsx)$/)) {
      alert("Please select a .jsx or .tsx file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      onFileSelect(content, file.name);
    };
    reader.readAsText(file);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <StyledPaper>
        <input
          ref={fileInputRef}
          style={{ display: "none" }}
          accept=".jsx,.tsx"
          id="contained-button-file"
          multiple={false}
          type="file"
          onChange={handleFileChange}
        />
        <StyledButton
          variant="contained"
          color="primary"
          onClick={handleButtonClick}
          startIcon={<CloudUpload />}
        >
          Upload Next.js File
        </StyledButton>
        <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
          Select a .jsx or .tsx file to convert
        </Typography>
      </StyledPaper>
    </ThemeProvider>
  );
};

const StyledEditorContainer = styled("div")(({ theme }) => ({
  minHeight: "500px",
  border: `1px solid ${theme.palette.divider}`,
}));

interface CodeEditorProps {
  code: string;
  language: "typescript" | "javascript";
  onChange: (value: string | undefined) => void;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  code,
  language,
  onChange,
}) => {
  return (
    <ThemeProvider theme={darkTheme}>
      <StyledPaper>
        <StyledEditorContainer>
          <Editor
            height="500px"
            defaultLanguage={language}
            value={code}
            onChange={onChange}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              wordWrap: "on",
              scrollBeyondLastLine: false,
              automaticLayout: true,
            }}
          />
        </StyledEditorContainer>
      </StyledPaper>
    </ThemeProvider>
  );
};

interface ConversionResult {
  code: string;
  warnings: string[];
}

const checkAndFixJSXErrors = (
  code: string
): { code: string; fixes: string[] } => {
  let modifiedCode = code;
  const fixes: string[] = [];

  // Check and fix React import
  if (!modifiedCode.includes("import React")) {
    if (
      modifiedCode.includes("JSX.Element") ||
      modifiedCode.match(/<[A-Z][^>]*>/)
    ) {
      modifiedCode = `import React from 'react';\n${modifiedCode}`;
      fixes.push("Added React import for JSX usage");
    }
  }

  // Check and fix default export
  if (
    !modifiedCode.includes("export default") &&
    modifiedCode.match(/function\s+([A-Z][A-Za-z]*)/)
  ) {
    const componentMatch = modifiedCode.match(/function\s+([A-Z][A-Za-z]*)/);
    if (componentMatch) {
      const componentName = componentMatch[1];
      modifiedCode = modifiedCode + `\n\nexport default ${componentName};`;
      fixes.push(`Added default export for component ${componentName}`);
    }
  }

  // Check and fix missing component type definitions
  if (modifiedCode.includes("interface") && modifiedCode.includes("FC")) {
    if (!modifiedCode.includes("import type { FC }")) {
      modifiedCode = modifiedCode.replace(
        /(import [^;]+;)(\n|$)/,
        `$1\nimport type { FC } from 'react';$2`
      );
      fixes.push("Added FC type import from React");
    }
  }

  // Fix missing key prop in mapped JSX elements
  const mapMatches = modifiedCode.match(/\.map\(\([^)]*\)\s*=>\s*\(<[^>]+>/g);
  if (mapMatches) {
    mapMatches.forEach((match) => {
      if (!match.includes("key={")) {
        modifiedCode = modifiedCode.replace(
          match,
          match.replace(/>$/, ` key={index}>`)
        );
        fixes.push("Added key prop to mapped JSX elements");
      }
    });
    // Add index parameter to map if not present
    modifiedCode = modifiedCode.replace(
      /\.map\(\(([^,)]+)\)\s*=>/g,
      ".map(($1, index) =>"
    );
  }

  // Fix void elements (self-closing tags)
  const voidElements = ["img", "br", "hr", "input", "meta", "link"];
  voidElements.forEach((element) => {
    const regex = new RegExp(`<${element}([^>]*)><//${element}>`, "g");
    if (modifiedCode.match(regex)) {
      modifiedCode = modifiedCode.replace(regex, `<${element}$1/>`);
      fixes.push(`Fixed self-closing tag for <${element}>`);
    }
  });

  // Fix className instead of class
  if (modifiedCode.includes('class="')) {
    modifiedCode = modifiedCode.replace(/class="/g, 'className="');
    fixes.push("Replaced class with className in JSX");
  }

  // Fix htmlFor instead of for in labels
  if (modifiedCode.includes("<label") && modifiedCode.includes('for="')) {
    modifiedCode = modifiedCode.replace(/for="/g, 'htmlFor="');
    fixes.push("Replaced for with htmlFor in label elements");
  }

  return { code: modifiedCode, fixes };
};

const convertNextToReact = (code: string): ConversionResult => {
  const warnings: string[] = [];
  let convertedCode = code;

  // Remove 'use client' directive
  if (
    convertedCode.includes('"use client"') ||
    convertedCode.includes("'use client'")
  ) {
    warnings.push("Removed 'use client' directive as it's not needed in React");
    convertedCode = convertedCode.replace(/(['"]use client['"];\s*)/g, "");
  }

  // Remove Next.js specific imports
  convertedCode = convertedCode.replace(
    /import\s+.*from\s+['"]next\/.*['"]/g,
    ""
  );

  // Convert getStaticProps to useEffect
  if (code.includes("export async function getStaticProps")) {
    warnings.push("getStaticProps has been converted to useEffect with fetch");
    convertedCode = convertedCode.replace(
      /export\s+async\s+function\s+getStaticProps\s*\(\s*\)\s*{([^}]*)}/g,
      (match, content) => {
        return `useEffect(() => {
    const fetchData = async () => {
      try {${content.replace("return {", "setProps({")}
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);`;
      }
    );
  }

  // Convert getServerSideProps to useEffect
  if (code.includes("export async function getServerSideProps")) {
    warnings.push(
      "getServerSideProps has been converted to useEffect with fetch"
    );
    convertedCode = convertedCode.replace(
      /export\s+async\s+function\s+getServerSideProps\s*\(\s*\)\s*{([^}]*)}/g,
      (match, content) => {
        return `useEffect(() => {
    const fetchData = async () => {
      try {${content.replace("return {", "setProps({")}
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);`;
      }
    );
  }

  // Add necessary React imports
  if (
    convertedCode.includes("useEffect") &&
    !convertedCode.includes("useEffect,")
  ) {
    convertedCode = convertedCode.replace(
      /import\s+{\s*([^}]*)\s*}\s+from\s+['"]react['"];?/,
      (match, imports) => {
        if (!imports.includes("useEffect")) {
          return match.replace("{", "{ useEffect,");
        }
        return match;
      }
    );
  }

  // Convert Image component
  if (code.includes("next/image")) {
    warnings.push(
      "Next.js Image component has been converted to standard img tag"
    );
    convertedCode = convertedCode.replace(
      /<Image\s+src=([^>]+)([^/]*)\/>/g,
      '<img src=$1 alt="" $2/>'
    );
  }

  // Convert Link component
  if (code.includes("next/link")) {
    warnings.push(
      "Next.js Link component has been converted to React Router Link"
    );
    // Add React Router import if not present
    if (!convertedCode.includes("react-router-dom")) {
      convertedCode = `import { Link } from 'react-router-dom';\n${convertedCode}`;
    }
    convertedCode = convertedCode.replace(
      /<Link\s+href=([^>]+)>/g,
      "<Link to=$1>"
    );
  }

  // Convert router hooks
  // Handle useNavigate conversion and import
  if (code.includes("useRouter") || code.includes("router.push")) {
    warnings.push(
      "useRouter has been converted to useNavigate from React Router"
    );

    // Add react-router-dom import if not present
    if (!convertedCode.includes("react-router-dom")) {
      convertedCode = `import { useNavigate } from 'react-router-dom';\n${convertedCode}`;
    } else if (!convertedCode.includes("useNavigate")) {
      // Add useNavigate to existing react-router-dom import
      convertedCode = convertedCode.replace(
        /import\s*{([^}]*)}\s*from\s*['"]react-router-dom['"];?/,
        (match, imports) => {
          const newImports = imports.trim();
          return `import { useNavigate, ${newImports} } from 'react-router-dom';`;
        }
      );
    }

    // Replace useRouter import with useNavigate
    convertedCode = convertedCode.replace(
      /import\s*{\s*useRouter\s*}\s*from\s*['"]next\/router['"];?\n?/,
      ""
    );

    // Convert router initialization
    convertedCode = convertedCode.replace(
      /const\s+router\s*=\s*useRouter\(\);/,
      "const navigate = useNavigate();"
    );

    // Convert router.push calls
    convertedCode = convertedCode.replace(/router\.push/g, "navigate");
  }

  // Add React state for props if needed
  if (convertedCode.includes("setProps(")) {
    convertedCode = convertedCode.replace(
      /function\s+(\w+)\s*\([^)]*\)\s*{/,
      (match, functionName) => {
        return `function ${functionName}() {\n  const [props, setProps] = useState({});`;
      }
    );

    // Add useState to React imports
    convertedCode = convertedCode.replace(
      /import\s+{\s*([^}]*)\s*}\s+from\s+['"]react['"];?/,
      (match, imports) => {
        if (!imports.includes("useState")) {
          return match.replace("{", "{ useState,");
        }
        return match;
      }
    );
  }

  // Check and fix JSX/TSX errors
  const { code: fixedCode, fixes } = checkAndFixJSXErrors(convertedCode);

  // Add any JSX fixes to warnings
  warnings.push(...fixes);

  return {
    code: fixedCode,
    warnings,
  };
};

const StyledContainer = styled(Container)(({ theme }) => ({
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(4),
}));

const StyledTitle = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(4),
  textAlign: "center",
}));

const ButtonContainer = styled("div")(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
  gap: theme.spacing(2),
  marginTop: theme.spacing(2),
}));

export default function NextToReactJS() {
  const [originalCode, setOriginalCode] = useState("");
  const [convertedCode, setConvertedCode] = useState("");
  const [fileName, setFileName] = useState("");
  const [warnings, setWarnings] = useState<string[]>([]);
  const [showWarnings, setShowWarnings] = useState(false);
  const [showCopySuccess, setShowCopySuccess] = useState(false);

  const handleFileSelect = (content: string, name: string) => {
    setFileName(name);
    setOriginalCode(content);
    const result = convertNextToReact(content);
    setConvertedCode(result.code);
    setWarnings(result.warnings);
    if (result.warnings.length > 0) {
      setShowWarnings(true);
    }
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([convertedCode], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = fileName.replace(/\.(jsx|tsx)$/, ".react.$1");
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(convertedCode);
    setShowCopySuccess(true);
  };

  const handleClear = () => {
    setOriginalCode("");
    setConvertedCode("");
    setFileName("");
    setWarnings([]);
    setShowWarnings(false);
    setShowCopySuccess(false);
  };

  return (
    <StyledContainer>
      <StyledTitle variant="h4">Next.js to React.js Converter</StyledTitle>

      <FileUploader onFileSelect={handleFileSelect} />

      {originalCode && (
        <>
          <Typography variant="h6">Original Code:</Typography>
          <CodeEditor
            code={originalCode}
            language={fileName.endsWith(".tsx") ? "typescript" : "javascript"}
            onChange={(value) => setOriginalCode(value || "")}
          />

          <Typography variant="h6">Converted Code:</Typography>
          <CodeEditor
            code={convertedCode}
            language={fileName.endsWith(".tsx") ? "typescript" : "javascript"}
            onChange={(value) => setConvertedCode(value || "")}
          />

          <ButtonContainer>
            <Button
              variant="contained"
              color="primary"
              onClick={handleDownload}
              disabled={!convertedCode}
              startIcon={<Download />}
            >
              Download
            </Button>
            <Tooltip title="Copy to clipboard">
              <Button
                variant="contained"
                color="secondary"
                onClick={handleCopyToClipboard}
                disabled={!convertedCode}
                startIcon={<ContentCopy />}
              >
                Copy Code
              </Button>
            </Tooltip>
            <Button
              variant="outlined"
              color="error"
              onClick={handleClear}
              disabled={!convertedCode && !originalCode}
            >
              Clear All
            </Button>
          </ButtonContainer>
        </>
      )}

      <Snackbar
        open={showCopySuccess}
        autoHideDuration={2000}
        onClose={() => setShowCopySuccess(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={() => setShowCopySuccess(false)} severity="success">
          Code copied to clipboard!
        </Alert>
      </Snackbar>

      {warnings.length > 0 && (
        <Snackbar
          open={showWarnings}
          autoHideDuration={6000}
          onClose={() => setShowWarnings(false)}
        >
          <Alert onClose={() => setShowWarnings(false)} severity="warning">
            {warnings.join(". ")}
          </Alert>
        </Snackbar>
      )}
    </StyledContainer>
  );
}
