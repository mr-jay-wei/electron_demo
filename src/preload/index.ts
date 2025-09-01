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
    // 新增：监听流式输出
    onCloudStream: (callback: (data: string) => void) => {
      ipcRenderer.on('cloud-stream-data', (_, data) => callback(data))
    }
  },
  process: {
    versions: process.versions
  }
}

contextBridge.exposeInMainWorld('electron', api)
