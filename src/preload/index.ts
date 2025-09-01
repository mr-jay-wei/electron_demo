// src/preload/index.ts
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'

// 统一暴露到 window.electron 的 API
const api = {
  renderer: {
    send: (channel: string, data?: any) => ipcRenderer.send(channel, data),
    on: (channel: string, listener: (event: IpcRendererEvent, ...args: any[]) => void) => {
      ipcRenderer.on(channel, listener)
    },
    invoke: (channel: string, ...args: any[]): Promise<any> => {
      return ipcRenderer.invoke(channel, ...args)
    }
  },
  // 只暴露需要的进程信息，避免把完整 process 暴露给渲染进程
  process: {
    versions: process.versions
  }
}

contextBridge.exposeInMainWorld('electron', api)

// ✅ 建议删除之前这里的 declare global（如果你留着，就改成 typeof api 保持一致）
declare global {
  interface Window {
    electron: typeof api
  }
}

export {}
