// src/renderer/src/App.tsx
import { useState } from 'react'

function App(): React.JSX.Element {
  const [appVersion, setAppVersion] = useState('未知')
  const [prompt, setPrompt] = useState('')
  const [response, setResponse] = useState('')

  const handleGetVersion = async (): Promise<void> => {
    const version = await window.electron.renderer.invoke('get-app-version')
    setAppVersion(version)
  }

  const handleAskCloud = async (): Promise<void> => {
    if (!prompt) return
    const ans = await window.electron.renderer.invoke('ask-llm-cloud', prompt)
    setResponse(ans)
  }

  const handleAskLocal = async (): Promise<void> => {
    if (!prompt) return
    const ans = await window.electron.renderer.invoke('ask-llm-local', prompt)
    setResponse(ans)
  }

  return (
    <div className="container" style={{ padding: 20 }}>
      <h1>Electron LLM Demo</h1>

      <div style={{ marginBottom: '10px' }}>
        <button onClick={handleGetVersion}>获取应用版本号</button>
        <span style={{ marginLeft: '10px' }}>当前版本: {appVersion}</span>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <textarea
          style={{ width: '100%', height: '80px' }}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="请输入你的问题..."
        />
      </div>

      <div style={{ marginBottom: '10px' }}>
        <button onClick={handleAskCloud}>云端 LLM 回复</button>
        <button onClick={handleAskLocal} style={{ marginLeft: '10px' }}>
          本地 LLM 回复
        </button>
      </div>

      <div>
        <p>模型回答：</p>
        <pre style={{ whiteSpace: 'pre-wrap' }}>{response}</pre>
      </div>
    </div>
  )
}

export default App
