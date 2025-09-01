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