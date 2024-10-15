'use client';

import {
  SandpackProvider,
  SandpackLayout,
  SandpackCodeEditor,
  SandpackPreview,
  SandpackStack,
  OpenInCodeSandboxButton,
  SandpackFiles,
  SandpackPredefinedTemplate,
} from '@codesandbox/sandpack-react';
import { Framework } from '@xyflow/xy-ui';
import cn from 'clsx';
import { useEffect, useState } from 'react';
import { OpenInCodesandbox } from './open-in-codesandbox';
import { OpenInStackblitz } from './open-in-stackblitz';

const defaultOptions = {
  editorHeight: '60vh',
  editorWidthPercentage: 45,
  wrapContent: true,
  readOnly: false,
};

export type RemoteCodeViewerProps = {
  source: RemoteCodeViewerSource;
  preview: string;
  framework: Framework;
  options?: typeof defaultOptions;
  activeFile?: string;
  showEditor?: boolean;
  showPreview?: boolean;
  customOpenButton?: React.ReactNode;
  sandpackOptions?: Record<string, any>;
  showOpenInCodeSandbox?: boolean;
  editorHeight?: string | number;
  orientation?: 'horizontal' | 'vertical';
};

export type RemoteCodeViewerSource =
  | string
  | {
      files: SandpackFiles;
      dependencies: Record<string, string>;
    };

export function RemoteCodeViewer({
  source,
  preview,
  framework,
  showEditor = true,
  customOpenButton = null,
  sandpackOptions = {},
  showOpenInCodeSandbox = framework === 'react',
  editorHeight = '60vh',
  activeFile,
  orientation,
}: RemoteCodeViewerProps) {
  const [filesFetched, setFilesFetched] = useState(typeof source === 'string');
  const [fileFetchFailed, setFileFetchFailed] = useState(false);
  const [files, setFiles] = useState<SandpackFiles>(
    typeof source === 'string'
      ? {
          'index.html': `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Example</title>
  </head>
  <body>
    <div id="app"></div>
  </body>
</html>`,
        }
      : source.files,
  );

  const _orientation = orientation
    ? orientation
    : typeof source === 'string' && source.includes('/examples/')
      ? 'vertical'
      : 'horizontal';

  const [dependencies, setDependencies] = useState<Record<string, string>>(
    typeof source === 'string' ? {} : source.dependencies,
  );

  useEffect(() => {
    const loadFiles = async (url: string) => {
      const res = await fetch(url);
      const json = await res.json();

      setFilesFetched(true);

      if ('files' in json && 'dependencies' in json) {
        const files = json.files;

        // this is a workaround for the examples that are using jsx
        // if we don't do this, sandpack will generate a default App.tsx file
        if (framework === 'react' && files['App.jsx']) {
          files['App.tsx'] = files['App.jsx'];
          delete files['App.jsx'];
        } else if (framework === 'svelte') {
          for (const file of Object.keys(files)) {
            if (file === 'index.html') {
              files[file] = files[file]?.replace('./index.ts', './src/main.ts');
              continue;
            }

            if (file === 'index.ts') {
              files['src/main.ts'] = files[file];
            } else {
              files[`src/${file}`] = files[file];
            }

            delete files[file];
          }
        }

        // we want to hide these files in the editor on website to reduce the noise
        ['index.html', 'index.jsx', 'index.tsx', 'src/main.ts'].forEach(
          (file) => {
            files[file] = {
              code: files[file],
              hidden: true,
            };
          },
        );

        setFiles(json.files);
        setDependencies(json.dependencies);
      } else {
        setFileFetchFailed(true);
      }
    };

    if (typeof source === 'string') {
      loadFiles(source);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (fileFetchFailed) {
    return (
      <div
        style={{ height: editorHeight }}
        className={`w-full color _bg-primary-100 flex justify-center content-center flex-wrap`}
      >
        <p className="text-react">Example failed to load</p>
      </div>
    );
  }

  const panelStyle = { height: editorHeight };

  // @ todo refactor this. activeFile should be passed separately or within the sandpackOptions
  sandpackOptions.readOnly = true;
  sandpackOptions.activeFile = sandpackOptions.activeFile || activeFile;

  return (
    <div
      className={cn('my-4 bg-gray-100', 'sandpack-wrapper', _orientation)}
      style={{ minHeight: editorHeight }}
    >
      {filesFetched && (
        <SandpackProvider
          template={framework === 'react' ? 'vite-react-ts' : 'vite-svelte-ts'}
          options={sandpackOptions}
          customSetup={{ dependencies, entry: 'index.html' }}
          files={files}
        >
          <SandpackLayout>
            {showEditor && (
              <SandpackCodeEditor readOnly={true} style={panelStyle} />
            )}

            <SandpackStack style={{ height: editorHeight }}>
              <div className="sp-preview-container" style={{ height: '100%' }}>
                <iframe
                  src={preview}
                  loading="lazy"
                  width="100%"
                  height="100%"
                  className="example"
                />
                <div
                  className="sp-preview-actions flex items-center gap-4"
                  style={{
                    zIndex: 10,
                    position: 'absolute',
                    bottom: 10,
                    right: 10,
                  }}
                >
                  <OpenInStackblitz
                    framework={framework}
                    files={files}
                    dependencies={dependencies}
                  />
                  <OpenInCodesandbox />
                </div>
              </div>
            </SandpackStack>
          </SandpackLayout>
        </SandpackProvider>
      )}
    </div>
  );
}
