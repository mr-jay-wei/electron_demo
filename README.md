# Electron LLM Demo

一个使用 Electron、React 和 TypeScript 构建的桌面应用，可以同时与云端大模型 (OpenRouter) 和本地大模型 (Ollama) 进行交互。

## 核心功能

- **双模型支持**: 可随时切换调用云端或本地的语言模型。
- **配置简单**: 通过 `.env` 文件即可轻松配置 API Key 和模型参数。
- **界面简洁**: 使用 React 构建，界面响应迅速，操作直观。
- **跨平台**: 基于 Electron，可打包为 Windows, macOS 和 Linux 应用。

## 技术栈

- **框架**: Electron
- **渲染进程**: React + Vite + TypeScript
- **主进程**: Node.js + TypeScript
- **打包**: electron-builder
- **代码规范**: ESLint + Prettier

## 项目设置与运行

### 1. 安装依赖

在项目根目录下打开终端，运行以下命令：

```bash
npm install
```
### 2. 环境配置 (首次运行必须！)
本项目需要连接到云端 LLM 服务 (OpenRouter)，因此需要配置 API Key。
在项目根目录 (与 package.json 同级) 创建一个名为 .env 的文件。
将以下内容复制到 .env 文件中，并填入你自己的信息：
```
OPENROUTER_API_KEY=your_openrouter_api_key
```
安全警告: .env 文件包含了你的私密信息，请勿将此文件提交到任何代码仓库或分享给他人！

### 3. 运行开发环境
配置好 .env 文件后，运行以下命令启动应用：
```bash
npm run dev
```
### 4. 打包应用
根据你的操作系统，选择对应的命令进行打包：
```bash
# 打包 Windows 应用
npm run build:win

# 打包 macOS 应用
npm run build:mac

# 打包 Linux 应用
npm run build:linux
```
---