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