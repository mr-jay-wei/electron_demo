// src/preload/index.ts
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'

const api = {
  renderer: {
    send: (channel: string, data?: any) => ipcRenderer.send(channel, data),
    on: (channel: string, listener: (event: IpcRendererEvent, ...args: any[]) => void) => {
      ipcRenderer.on(channel, listener)
    },
    invoke: (channel: string, ...args: any[]): Promise<any> => {
      return ipcRenderer.invoke(channel, ...args)
    },
    
    // ✅ 优化：监听流式输出，并返回一个用于取消监听的函数
    onCloudStream: (callback: (data: string) => void): (() => void) => {
      const listener = (_: IpcRendererEvent, data: string) => callback(data)
      ipcRenderer.on('cloud-stream-data', listener)
      
      // 返回一个函数，调用它即可移除监听器
      return () => {
        ipcRenderer.removeListener('cloud-stream-data', listener)
      }
    }
  },
  process: {
    versions: process.versions
  }
}

contextBridge.exposeInMainWorld('electron', api)

// ✅ 我们需要更新类型定义文件来匹配新的 onCloudStream 函数签名
declare global {
  interface Window {
    electron: typeof api
  }
}