// src/main/index.ts
import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join, dirname, resolve } from 'path' // ✅ 引入 path 模块的更多功能
import fs from 'fs' // ✅ 引入 fs 模块
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import OpenAI from 'openai'
import dotenv from 'dotenv'

// ✅ --- 智能查找并加载 .env 文件的函数 ---
function findAndLoadEnv() {
  let currentDir = __dirname // 从当前文件所在目录开始
  
  // 循环向上查找，直到到达根目录
  while (currentDir !== resolve(currentDir, '..')) {
    const envPath = join(currentDir, '.env')
    
    // 如果在当前目录找到了 .env 文件
    if (fs.existsSync(envPath)) {
      console.log(`✅ 成功在 ${currentDir} 目录找到并加载 .env 文件`)
      dotenv.config({ path: envPath })
      return // 找到就立刻停止
    }
    
    // 否则，移动到上一层父目录继续查找
    currentDir = resolve(currentDir, '..')
  }
  
  // 如果循环结束还没找到
  console.warn('⚠️ 未能在任何父目录中找到 .env 文件，将使用默认配置。')
}

// ✅ 在程序最开始，调用我们的智能查找函数来加载环境变量
findAndLoadEnv()
// --- 智能查找结束 ---


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
      contextIsolation: true
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

  ipcMain.handle('get-app-version', () => app.getVersion())

  ipcMain.handle('ask-llm-cloud', async (_, prompt: string) => {
    if (!client.apiKey) {
      console.error('OpenRouter API Key 未配置！')
      return '⚠️ 云端调用失败: 请在项目根目录或其父目录中放置 .env 文件并配置 OPENROUTER_API_KEY。'
    }

    try {
      const completion = await client.chat.completions.create({
        model: process.env.OPENROUTER_MODEL_NAME ?? 'deepseek/deepseek-chat-v3.1:free',
        messages: [{ role: 'user', content: prompt }]
      })
      return completion.choices?.[0]?.message?.content ?? '(云端无结果)'
    } catch (err: any) {
      console.error('云端调用出错:', err)
      if (err.status === 401) {
        return '⚠️ 云端调用失败: API Key 无效或错误，请检查 .env 文件中的配置。'
      }
      return `⚠️ 云端调用失败: ${err.message}`
    }
  })

  ipcMain.handle('ask-llm-local', async (_, prompt: string) => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      const resp = await fetch('http://127.0.0.1:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'llama3', prompt }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

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