// src/main/index.ts
import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import OpenAI from 'openai'
import dotenv from 'dotenv'

// ✅ 在程序最开始加载 .env 文件中的环境变量
dotenv.config()

// ✅ 使用环境变量存储 OpenRouter API 信息
const client = new OpenAI({
  baseURL: process.env.OPENROUTER_BASE_URL ?? 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY ?? ''
})

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true // ✅ 安全性最佳实践：始终开启上下文隔离
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    // 开发模式下自动打开开发者工具
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // ✅ 获取应用版本
  ipcMain.handle('get-app-version', () => app.getVersion())

  // ✅ 云端 LLM 调用 (OpenRouter)
  ipcMain.handle('ask-llm-cloud', async (_, prompt: string) => {
    // ✅ 增加对 API Key 是否存在的检查
    if (!client.apiKey) {
      console.error('OpenRouter API Key 未配置！')
      return '⚠️ 云端调用失败: 请在项目根目录的 .env 文件中配置 OPENROUTER_API_KEY。'
    }

    try {
      const completion = await client.chat.completions.create({
        model: process.env.OPENROUTER_MODEL_NAME ?? 'deepseek/deepseek-chat-v3.1:free',
        messages: [{ role: 'user', content: prompt }]
      })
      return completion.choices?.[0]?.message?.content ?? '(云端无结果)'
    } catch (err: any) {
      console.error('云端调用出错:', err)
      // ✅ 优化错误返回信息，让用户更容易理解
      if (err.status === 401) {
        return '⚠️ 云端调用失败: API Key 无效或错误，请检查 .env 文件中的配置。'
      }
      return `⚠️ 云端调用失败: ${err.message}`
    }
  })

  // ✅ 本地 LLM 调用 (Ollama REST API)
  ipcMain.handle('ask-llm-local', async (_, prompt: string) => {
    try {
      // ✅ 增加超时处理，避免长时间无响应
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5秒超时

      const resp = await fetch('http://127.0.0.1:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'llama3', prompt }),
        signal: controller.signal
      })

      clearTimeout(timeoutId) // 清除超时定时器

      // Ollama 流式响应返回的是 NDJSON，这里简化处理，只取最后一部分
      const text = await resp.text()
      const lines = text.trim().split('\n')
      const lastLine = lines[lines.length - 1]
      const data = JSON.parse(lastLine)
      
      return data.response ?? '(本地无结果)'
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return '⚠️ 本地模型响应超时，请确认 Ollama 服务是否正常且模型已加载。'
      }
      return '⚠️ 本地模型未运行，请先启动 Ollama 或本地 LLM 服务'
    }
  })

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})