// src/preload/index.d.ts

declare global {
  interface Window {
    electron: {
      renderer: {
        send: (channel: string, data?: any) => void
        on: (channel: string, listener: (event: any, ...args: any[]) => void) => void
        invoke: (channel: string, ...args: any[]) => Promise<any>
      }
      process: {
        versions: NodeJS.ProcessVersions
      }
    }
    api: unknown
  }
}

export {}
