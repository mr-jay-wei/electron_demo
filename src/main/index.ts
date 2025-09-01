// src/main/index.ts
import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import OpenAI from 'openai'

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

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
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
    try {
      const completion = await client.chat.completions.create({
        model: process.env.OPENROUTER_MODEL_NAME ?? 'deepseek/deepseek-chat-v3.1:free',
        messages: [{ role: 'user', content: prompt }]
      })
      return completion.choices?.[0]?.message?.content ?? '(云端无结果)'
    } catch (err: any) {
      console.error('云端调用出错:', err)
      return `⚠️ 云端调用失败: ${err.message}`
    }
  })

  // ✅ 本地 LLM 调用 (Ollama REST API)
  ipcMain.handle('ask-llm-local', async (_, prompt: string) => {
    try {
      const resp = await fetch('http://127.0.0.1:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'llama3', prompt })
      })
      const data = await resp.json()
      return data.response ?? '(本地无结果)'
    } catch {
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
