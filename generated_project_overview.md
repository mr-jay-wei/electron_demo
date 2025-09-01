# 项目概览: electron_demo

本文档由`generate_project_overview.py`自动生成，包含了项目的结构树和所有可读文件的内容。

## 项目结构

```
electron_demo/
├── out
│   ├── main
│   │   └── index.js
│   └── preload
│       └── index.js
├── resources
├── src
│   ├── main
│   │   └── index.ts
│   ├── preload
│   │   ├── index.d.ts
│   │   └── index.ts
│   └── renderer
│       ├── src
│       │   ├── assets
│       │   │   ├── base.css
│       │   │   └── main.css
│       │   ├── components
│       │   │   └── Versions.tsx
│       │   ├── App.tsx
│       │   ├── env.d.ts
│       │   └── main.tsx
│       └── index.html
├── .editorconfig
├── .gitignore
├── .npmrc
├── .prettierignore
├── .prettierrc.yaml
├── electron-builder.yml
├── electron.vite.config.ts
├── eslint.config.mjs
├── package.json
├── README.md
├── tsconfig.json
├── tsconfig.node.json
└── tsconfig.web.json
```

---

# 文件内容

## `.editorconfig`

```
root = true

[*]
charset = utf-8
indent_style = space
indent_size = 2
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true
```

## `.gitignore`

```
node_modules
dist
out
.DS_Store
.eslintcache
*.log*
.env

```

## `.npmrc`

```
electron_mirror=https://npmmirror.com/mirrors/electron/
electron_builder_binaries_mirror=https://npmmirror.com/mirrors/electron-builder-binaries/

```

## `.prettierignore`

```
out
dist
pnpm-lock.yaml
LICENSE.md
tsconfig.json
tsconfig.*.json

```

## `.prettierrc.yaml`

```yaml
singleQuote: true
semi: false
printWidth: 100
trailingComma: none

```

## `electron-builder.yml`

```yaml
appId: com.electron.app
productName: electron_demo
directories:
  buildResources: build
files:
  - '!**/.vscode/*'
  - '!src/*'
  - '!electron.vite.config.{js,ts,mjs,cjs}'
  - '!{.eslintcache,eslint.config.mjs,.prettierignore,.prettierrc.yaml,dev-app-update.yml,CHANGELOG.md,README.md}'
  - '!{.env,.env.*,.npmrc,pnpm-lock.yaml}'
  - '!{tsconfig.json,tsconfig.node.json,tsconfig.web.json}'
asarUnpack:
  - resources/**
win:
  executableName: electron_demo
nsis:
  artifactName: ${name}-${version}-setup.${ext}
  shortcutName: ${productName}
  uninstallDisplayName: ${productName}
  createDesktopShortcut: always
mac:
  entitlementsInherit: build/entitlements.mac.plist
  extendInfo:
    - NSCameraUsageDescription: Application requests access to the device's camera.
    - NSMicrophoneUsageDescription: Application requests access to the device's microphone.
    - NSDocumentsFolderUsageDescription: Application requests access to the user's Documents folder.
    - NSDownloadsFolderUsageDescription: Application requests access to the user's Downloads folder.
  notarize: false
dmg:
  artifactName: ${name}-${version}.${ext}
linux:
  target:
    - AppImage
    - snap
    - deb
  maintainer: electronjs.org
  category: Utility
appImage:
  artifactName: ${name}-${version}.${ext}
npmRebuild: false
publish:
  provider: generic
  url: https://example.com/auto-updates
electronDownload:
  mirror: https://npmmirror.com/mirrors/electron/

```

## `electron.vite.config.ts`

```typescript
import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [react()]
  }
})

```

## `eslint.config.mjs`

```
import tseslint from '@electron-toolkit/eslint-config-ts'
import eslintConfigPrettier from '@electron-toolkit/eslint-config-prettier'
import eslintPluginReact from 'eslint-plugin-react'
import eslintPluginReactHooks from 'eslint-plugin-react-hooks'
import eslintPluginReactRefresh from 'eslint-plugin-react-refresh'

export default tseslint.config(
  { ignores: ['**/node_modules', '**/dist', '**/out'] },
  tseslint.configs.recommended,
  eslintPluginReact.configs.flat.recommended,
  eslintPluginReact.configs.flat['jsx-runtime'],
  {
    settings: {
      react: {
        version: 'detect'
      }
    }
  },
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': eslintPluginReactHooks,
      'react-refresh': eslintPluginReactRefresh
    },
    rules: {
      ...eslintPluginReactHooks.configs.recommended.rules,
      ...eslintPluginReactRefresh.configs.vite.rules
    }
  },
  eslintConfigPrettier
)

```

## `out/main/index.js`

```javascript
"use strict";
const electron = require("electron");
const path = require("path");
const utils = require("@electron-toolkit/utils");
const icon = path.join(__dirname, "../../resources/icon.png");
function createWindow() {
  const mainWindow = new electron.BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...process.platform === "linux" ? { icon } : {},
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      sandbox: false
    }
  });
  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
  });
  mainWindow.webContents.setWindowOpenHandler((details) => {
    electron.shell.openExternal(details.url);
    return { action: "deny" };
  });
  if (utils.is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
}
electron.app.whenReady().then(() => {
  utils.electronApp.setAppUserModelId("com.electron");
  electron.app.on("browser-window-created", (_, window) => {
    utils.optimizer.watchWindowShortcuts(window);
  });
  electron.ipcMain.on("ping", () => console.log("pong"));
  electron.ipcMain.handle("get-app-version", () => {
    console.log("主进程收到了获取应用版本的请求");
    return electron.app.getVersion();
  });
  createWindow();
  electron.app.on("activate", function() {
    if (electron.BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});

```

## `out/preload/index.js`

```javascript
"use strict";
const electron = require("electron");
const ipc = {
  renderer: {
    send: (channel, data) => electron.ipcRenderer.send(channel, data),
    on: (channel, listener) => {
      electron.ipcRenderer.on(channel, listener);
    },
    // 新增一个 invoke 方法
    invoke: (channel, ...args) => {
      return electron.ipcRenderer.invoke(channel, ...args);
    }
  }
};
electron.contextBridge.exposeInMainWorld("electron", ipc);

```

## `package.json`

```json
{
  "name": "electron_demo",
  "version": "1.0.1",
  "description": "An Electron application with React and TypeScript",
  "main": "./out/main/index.js",
  "author": "example.com",
  "homepage": "https://electron-vite.org",
  "scripts": {
    "format": "prettier --write .",
    "lint": "eslint --cache .",
    "typecheck:node": "tsc --noEmit -p tsconfig.node.json --composite false",
    "typecheck:web": "tsc --noEmit -p tsconfig.web.json --composite false",
    "typecheck": "npm run typecheck:node && npm run typecheck:web",
    "start": "electron-vite preview",
    "dev": "electron-vite dev",
    "build": "npm run typecheck && electron-vite build",
    "postinstall": "electron-builder install-app-deps",
    "build:unpack": "npm run build && electron-builder --dir",
    "build:win": "npm run build && electron-builder --win",
    "build:mac": "electron-vite build && electron-builder --mac",
    "build:linux": "electron-vite build && electron-builder --linux"
  },
  "dependencies": {
    "@electron-toolkit/preload": "^3.0.2",
    "@electron-toolkit/utils": "^4.0.0",
    "dotenv": "^17.2.1",
    "openai": "^5.16.0"
  },
  "devDependencies": {
    "@electron-toolkit/eslint-config-prettier": "^3.0.0",
    "@electron-toolkit/eslint-config-ts": "^3.0.0",
    "@electron-toolkit/tsconfig": "^1.0.1",
    "@types/node": "^22.16.5",
    "@types/react": "^19.1.8",
    "@types/react-dom": "^19.1.6",
    "@vitejs/plugin-react": "^4.7.0",
    "electron": "^37.2.3",
    "electron-builder": "^25.1.8",
    "electron-vite": "^4.0.0",
    "eslint": "^9.31.0",
    "eslint-plugin-react": "^7.37.5",
    "eslint-plugin-react-hooks": "^5.2.0",
    "eslint-plugin-react-refresh": "^0.4.20",
    "prettier": "^3.6.2",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "typescript": "^5.8.3",
    "vite": "^7.0.5"
  }
}

```

## `README.md`

````text
\# electron_demo

An Electron application with React and TypeScript

#\# Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

#\# Project Setup

##\# Install

\`\`\`bash
$ npm install
\`\`\`

##\# Development

\`\`\`bash
$ npm run dev
\`\`\`

##\# Build

\`\`\`bash
\# For windows
$ npm run build:win

\# For macOS
$ npm run build:mac

\# For Linux
$ npm run build:linux
\`\`\`

````

## `src/main/index.ts`

```typescript
import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))
  // 新增：监听 'get-app-version' 请求，并返回应用版本号
  ipcMain.handle('get-app-version', () => {
    console.log('主进程收到了获取应用版本的请求') // 在命令行打印日志，方便调试
    return app.getVersion()
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

```

## `src/preload/index.d.ts`

```typescript
import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: unknown
  }
}

```

## `src/preload/index.ts`

```typescript
// src/preload/index.ts
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'

// 白名单，只允许暴露特定的通道
const ipc = {
  renderer: {
    send: (channel: string, data?: any) => ipcRenderer.send(channel, data),
    on: (channel: string, listener: (event: IpcRendererEvent, ...args: any[]) => void) => {
      ipcRenderer.on(channel, listener)
    },
    // 新增一个 invoke 方法
    invoke: (channel: string, ...args: any[]): Promise<any> => {
      return ipcRenderer.invoke(channel, ...args)
    }
  }
}

// 将 ipc 对象挂载到 window.electron 上
contextBridge.exposeInMainWorld('electron', ipc)

// 为了让 TypeScript 能够识别我们新增的 window.electron 对象
// 我们需要扩展一下 Window 接口
declare global {
  interface Window {
    electron: typeof ipc
  }
}
```

## `src/renderer/index.html`

```html
<!doctype html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>Electron</title>
    <!-- https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP -->
    <meta
      http-equiv="Content-Security-Policy"
      content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:"
    />
  </head>

  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>

```

## `src/renderer/src/App.tsx`

```
// src/renderer/src/App.tsx
import { useState } from 'react'
// ... 其他 import ...

function App(): JSX.Element {
  // 创建一个 state 来存储版本号
  const [appVersion, setAppVersion] = useState('未知')

  const handleSend = (): void => {
    window.electron.renderer.send('ping')
  }

  // 新增：处理获取版本号的点击事件
  const handleGetVersion = async (): Promise<void> => {
    // 调用我们通过 preload 暴露的 invoke 方法
    const version = await window.electron.renderer.invoke('get-app-version')
    console.log('渲染进程收到了版本号:', version) // 在开发者工具的 Console 中打印
    setAppVersion(version)
  }

  return (
    <div className="container">
      {/* ... 原来的内容 ... */}
      <h1>我们一起构建的第一个桌面应用</h1>

      {/* ... 原来的按钮 ... */}
      <button onClick={handleSend}>发送 Ping 消息到主进程</button>
      
      {/* 新增的按钮和显示区域 */}
      <div style={{ marginTop: '20px' }}>
        <button onClick={handleGetVersion}>获取应用版本号</button>
        <p>当前应用版本: <strong>{appVersion}</strong></p>
      </div>
    </div>
  )
}

export default App
```

## `src/renderer/src/assets/base.css`

```css
:root {
  --ev-c-white: #ffffff;
  --ev-c-white-soft: #f8f8f8;
  --ev-c-white-mute: #f2f2f2;

  --ev-c-black: #1b1b1f;
  --ev-c-black-soft: #222222;
  --ev-c-black-mute: #282828;

  --ev-c-gray-1: #515c67;
  --ev-c-gray-2: #414853;
  --ev-c-gray-3: #32363f;

  --ev-c-text-1: rgba(255, 255, 245, 0.86);
  --ev-c-text-2: rgba(235, 235, 245, 0.6);
  --ev-c-text-3: rgba(235, 235, 245, 0.38);

  --ev-button-alt-border: transparent;
  --ev-button-alt-text: var(--ev-c-text-1);
  --ev-button-alt-bg: var(--ev-c-gray-3);
  --ev-button-alt-hover-border: transparent;
  --ev-button-alt-hover-text: var(--ev-c-text-1);
  --ev-button-alt-hover-bg: var(--ev-c-gray-2);
}

:root {
  --color-background: var(--ev-c-black);
  --color-background-soft: var(--ev-c-black-soft);
  --color-background-mute: var(--ev-c-black-mute);

  --color-text: var(--ev-c-text-1);
}

*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  font-weight: normal;
}

ul {
  list-style: none;
}

body {
  min-height: 100vh;
  color: var(--color-text);
  background: var(--color-background);
  line-height: 1.6;
  font-family:
    Inter,
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    Oxygen,
    Ubuntu,
    Cantarell,
    'Fira Sans',
    'Droid Sans',
    'Helvetica Neue',
    sans-serif;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

```

## `src/renderer/src/assets/main.css`

```css
@import './base.css';

body {
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  background-image: url('./wavy-lines.svg');
  background-size: cover;
  user-select: none;
}

code {
  font-weight: 600;
  padding: 3px 5px;
  border-radius: 2px;
  background-color: var(--color-background-mute);
  font-family:
    ui-monospace,
    SFMono-Regular,
    SF Mono,
    Menlo,
    Consolas,
    Liberation Mono,
    monospace;
  font-size: 85%;
}

#root {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  margin-bottom: 80px;
}

.logo {
  margin-bottom: 20px;
  -webkit-user-drag: none;
  height: 128px;
  width: 128px;
  will-change: filter;
  transition: filter 300ms;
}

.logo:hover {
  filter: drop-shadow(0 0 1.2em #6988e6aa);
}

.creator {
  font-size: 14px;
  line-height: 16px;
  color: var(--ev-c-text-2);
  font-weight: 600;
  margin-bottom: 10px;
}

.text {
  font-size: 28px;
  color: var(--ev-c-text-1);
  font-weight: 700;
  line-height: 32px;
  text-align: center;
  margin: 0 10px;
  padding: 16px 0;
}

.tip {
  font-size: 16px;
  line-height: 24px;
  color: var(--ev-c-text-2);
  font-weight: 600;
}

.react {
  background: -webkit-linear-gradient(315deg, #087ea4 55%, #7c93ee);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: 700;
}

.ts {
  background: -webkit-linear-gradient(315deg, #3178c6 45%, #f0dc4e);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: 700;
}

.actions {
  display: flex;
  padding-top: 32px;
  margin: -6px;
  flex-wrap: wrap;
  justify-content: flex-start;
}

.action {
  flex-shrink: 0;
  padding: 6px;
}

.action a {
  cursor: pointer;
  text-decoration: none;
  display: inline-block;
  border: 1px solid transparent;
  text-align: center;
  font-weight: 600;
  white-space: nowrap;
  border-radius: 20px;
  padding: 0 20px;
  line-height: 38px;
  font-size: 14px;
  border-color: var(--ev-button-alt-border);
  color: var(--ev-button-alt-text);
  background-color: var(--ev-button-alt-bg);
}

.action a:hover {
  border-color: var(--ev-button-alt-hover-border);
  color: var(--ev-button-alt-hover-text);
  background-color: var(--ev-button-alt-hover-bg);
}

.versions {
  position: absolute;
  bottom: 30px;
  margin: 0 auto;
  padding: 15px 0;
  font-family: 'Menlo', 'Lucida Console', monospace;
  display: inline-flex;
  overflow: hidden;
  align-items: center;
  border-radius: 22px;
  background-color: #202127;
  backdrop-filter: blur(24px);
}

.versions li {
  display: block;
  float: left;
  border-right: 1px solid var(--ev-c-gray-1);
  padding: 0 20px;
  font-size: 14px;
  line-height: 14px;
  opacity: 0.8;
  &:last-child {
    border: none;
  }
}

@media (max-width: 720px) {
  .text {
    font-size: 20px;
  }
}

@media (max-width: 620px) {
  .versions {
    display: none;
  }
}

@media (max-width: 350px) {
  .tip,
  .actions {
    display: none;
  }
}

```

## `src/renderer/src/components/Versions.tsx`

```
import { useState } from 'react'

function Versions(): React.JSX.Element {
  const [versions] = useState(window.electron.process.versions)

  return (
    <ul className="versions">
      <li className="electron-version">Electron v{versions.electron}</li>
      <li className="chrome-version">Chromium v{versions.chrome}</li>
      <li className="node-version">Node v{versions.node}</li>
    </ul>
  )
}

export default Versions

```

## `src/renderer/src/env.d.ts`

```typescript
/// <reference types="vite/client" />

```

## `src/renderer/src/main.tsx`

```
import './assets/main.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)

```

## `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "lib": ["DOM", "DOM.Iterable", "ESNext"],
    "module": "ESNext",
    "skipLibCheck": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx", // <-- [JSX 修正] 告诉 TypeScript 如何处理 JSX 语法

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": [
    "electron.vite.config.*",
    "src/main/**/*",
    "src/preload/**/*",
    "src/renderer/src/**/*" // <-- [window.api 修正] 确保编译器扫描并加载 renderer 目录下的所有文件，包括我们新建的 preload.d.ts
  ],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

## `tsconfig.node.json`

```json
{
  "extends": "@electron-toolkit/tsconfig/tsconfig.node.json",
  "include": ["electron.vite.config.*", "src/main/**/*", "src/preload/**/*"],
  "compilerOptions": {
    "composite": true,
    "types": ["electron-vite/node"]
  }
}

```

## `tsconfig.web.json`

```json
{
  "extends": "@electron-toolkit/tsconfig/tsconfig.web.json",
  "include": [
    "src/renderer/src/env.d.ts",
    "src/renderer/src/**/*",
    "src/renderer/src/**/*.tsx",
    "src/preload/*.d.ts"
  ],
  "compilerOptions": {
    "composite": true,
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": {
      "@renderer/*": [
        "src/renderer/src/*"
      ]
    }
  }
}

```

