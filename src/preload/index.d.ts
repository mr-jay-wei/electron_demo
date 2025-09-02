// src/preload/index.d.ts
import { IpcRendererEvent } from 'electron'

// ✅ 为暴露到 window.electron 的 API 定义精确的类型
export interface IElectronAPI {
  renderer: {
    send: (channel: string, data?: any) => void
    on: (channel: string, listener: (event: IpcRendererEvent, ...args: any[]) => void) => void
    invoke: <T>(channel: string, ...args: any[]) => Promise<T>
    onCloudStream: (callback: (data: string) => void) => () => void // ✅ 更新这里的类型
  }
  process: {
    versions: NodeJS.ProcessVersions
  }
}

declare global {
  interface Window {
    // 将 electron API 绑定到 window 对象上
    electron: IElectronAPI
  }
}

export {}