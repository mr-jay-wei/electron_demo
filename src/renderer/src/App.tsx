// src/renderer/src/App.tsx
import { useState, useEffect, useRef } from 'react' // ✅ 引入 useEffect

function App(): React.JSX.Element {
  const [appVersion, setAppVersion] = useState('未知')
  const [prompt, setPrompt] = useState('')
  const [response, setResponse] = useState('')
  const [isStreaming, setIsStreaming] = useState(false) // ✅ 新增状态：用于判断是否正在流式输出
  const preRef = useRef<HTMLPreElement>(null)

  // ✅ 使用 useEffect 来管理事件监听的生命周期
  useEffect(() => {
    // 这个函数只会在组件首次加载时运行一次

    // 设置监听器，并获取取消监听的函数
    const cleanup = window.electron.renderer.onCloudStream((delta) => {
      setResponse((prev) => prev + delta)
    })

    // 返回一个清理函数
    // 这个函数将会在组件被卸载时自动调用
    return () => {
      console.log('组件卸载，取消云端流式监听')
      cleanup()
    }
  }, []) // ✅ 空数组 [] 意味着这个 effect 只运行一次，类似 "componentDidMount"

  // ✅ 新增一个 effect，专门负责自动滚动
  useEffect(() => {
    // 每当 response 变化时，这个 effect 就会运行
    if (preRef.current) {
      // preRef.current 就是那个 <pre> DOM 元素
      preRef.current.scrollTop = preRef.current.scrollHeight
    }
  }, [response])

  const handleGetVersion = async (): Promise<void> => {
    const version = await window.electron.renderer.invoke('get-app-version')
    setAppVersion(version)
  }

  const handleAskCloud = async (): Promise<void> => {
    if (!prompt || isStreaming) return
    setResponse('')
    const ans = await window.electron.renderer.invoke('ask-llm-cloud', prompt)
    setResponse(ans)
  }

  const handleAskCloudStream = async (): Promise<void> => {
    if (!prompt || isStreaming) return
    setResponse('') // 清空旧内容
    setIsStreaming(true) // 开始流式输出

    try {
      // 只发起请求，数据接收由 useEffect 中的监听器负责
      await window.electron.renderer.invoke('ask-llm-cloud-stream', prompt)
    } catch (error) {
      console.error('流式请求调用失败:', error)
      setResponse('流式请求发起失败，请查看主进程日志。')
    } finally {
      setIsStreaming(false) // 流式输出结束
    }
  }

  const handleAskLocal = async (): Promise<void> => {
    if (!prompt || isStreaming) return
    setResponse('')
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
          disabled={isStreaming} // ✅ 当流式输出时，禁用输入框
        />
      </div>

      <div style={{ marginBottom: '10px' }}>
        <button onClick={handleAskCloud} disabled={isStreaming}>
          云端 LLM 回复
        </button>
        <button
          onClick={handleAskCloudStream}
          style={{ marginLeft: '10px' }}
          disabled={isStreaming}
        >
          {isStreaming ? '正在接收...' : '云端流式 LLM 回复'}
        </button>
        <button onClick={handleAskLocal} style={{ marginLeft: '10px' }} disabled={isStreaming}>
          本地 LLM 回复
        </button>
      </div>

      <div>
        <p>模型回答：</p>
        <pre
          ref={preRef}
          style={{
            whiteSpace: 'pre-wrap',
            wordWrap: 'break-word', // 确保长单词也能换行
            height: '200px', // ✅ 设置一个固定的高度
            overflowY: 'auto', // ✅ 当内容超出高度时，自动显示垂直滚动条
            border: '1px solid #555', // 加个边框让它更像一个独立的区域
            padding: '10px', // 增加内边距
            backgroundColor: '#1e1e1e' // 给个深色背景
          }}
        >
          {response}
        </pre>
      </div>
    </div>
  )
}

export default App
