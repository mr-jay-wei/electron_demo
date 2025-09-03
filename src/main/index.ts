// src/main/index.ts
import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join, resolve } from 'path' // ✅ 引入 path 模块的更多功能
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

  // 应用版本号
  ipcMain.handle('get-app-version', () => app.getVersion())

  // 云端 LLM（一次性返回）
  ipcMain.handle('ask-llm-cloud', async (_, prompt: string) => {
    try {
      const completion = await client.chat.completions.create({
        model: process.env.OPENROUTER_MODEL_NAME ?? 'openai/gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }]
      })
      return completion.choices?.[0]?.message?.content ?? '(云端无结果)'
    } catch (err: any) {
      console.error('云端调用出错:', err)
      return `⚠️ 云端调用失败: ${err.message}`
    }
  })

  // 云端 LLM（流式输出）
  ipcMain.handle('ask-llm-cloud-stream', async (_, prompt: string) => {
    if (!client.apiKey) {
      return '⚠️ 云端调用失败: API Key 未配置'
    }

    try {
      const stream = await client.chat.completions.create({
        model: process.env.OPENROUTER_MODEL_NAME ?? 'openai/gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        stream: true
      })

      let fullText = ''
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content ?? ''
        fullText += delta

        // 推送到渲染进程
        BrowserWindow.getAllWindows().forEach((win) => {
          win.webContents.send('cloud-stream-data', delta)
        })
      }

      return fullText
    } catch (err: any) {
      console.error('流式云端调用出错:', err)
      return `⚠️ 云端调用失败: ${err.message}`
    }
  })

  // 本地 LLM（Ollama）
  ipcMain.handle('ask-llm-local', async (_, prompt: string) => {
    // ✅ 增加一个日志，确认函数被调用且参数正确
    console.log(`[Ollama] 收到本地调用请求, prompt: "${prompt}"`)

    try {
      const resp = await fetch('http://127.0.0.1:11434/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gemma3:270m', // 确保这个模型名称你已经 pull 下来了
          messages: [{ role: 'user', content: prompt }],
          stream: false // ✅ 明确地像 curl 一样，添加 stream: false
        })
      })

      // ✅ 增加判断，检查网络请求是否真的成功 (HTTP 状态码 200-299)
      if (!resp.ok) {
        // 如果状态码不对，读取错误文本并抛出
        const errorText = await resp.text()
        console.error(`[Ollama] 请求失败，HTTP 状态码: ${resp.status}`, errorText)
        throw new Error(`请求失败，状态码 ${resp.status}: ${errorText}`)
      }

      const data = await resp.json()
      return data.message?.content ?? '(本地无结果)'
    } catch (err: any) {
      // ✅ 修改这里，接收错误对象 err
      // ✅ 核心修改：在控制台打印出完整的、真实的错误信息！
      console.error('[Ollama] 本地调用时发生严重错误:', err)

      // ✅ 返回一个更具体的错误信息给界面
      return `⚠️ 本地模型调用失败: ${err.message}`
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
