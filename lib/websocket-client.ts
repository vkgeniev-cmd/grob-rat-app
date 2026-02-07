// t.me/SentinelLinks

// Утилита для подключения к WebSocket серверам устройств
export class DeviceWebSocket {
  private ws: WebSocket | null = null
  private deviceIp: string
  private devicePort = 8000

  constructor(deviceIp: string, port = 8000) {
    this.deviceIp = deviceIp
    this.devicePort = port
  }

// t.me/SentinelLinks
  async connect(): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(`ws://${this.deviceIp}:${this.devicePort}`)

        this.ws.onopen = () => {
          resolve(this.ws!)
        }

        this.ws.onerror = (error) => {
          reject(new Error("Не удалось подключиться к устройству"))
        }

        setTimeout(() => {
          if (this.ws?.readyState !== WebSocket.OPEN) {
            reject(new Error("Timeout подключения"))
          }
        }, 5000)
      } catch (error) {
        reject(error)
      }
    })
  }

  async sendCommand(type: string, data: any = {}): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error("WebSocket не подключен"))
        return
      }

      const messageHandler = (event: MessageEvent) => {
        try {
          const response = JSON.parse(event.data)
          this.ws?.removeEventListener("message", messageHandler)
          resolve(response)
        } catch (error) {
          reject(error)
        }
      }

      this.ws.addEventListener("message", messageHandler)

      this.ws.send(JSON.stringify({ type, ...data }))

// t.me/SentinelLinks
      setTimeout(() => {
        this.ws?.removeEventListener("message", messageHandler)
        reject(new Error("Timeout ответа от устройства"))
      }, 10000)
    })
  }

  close() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }
}

export { DeviceWebSocket as WebSocketClient }

//  ____             _   _            _
// / ___|  ___ _  | |_(_)_    ___| |   
// \___ \ / _ \ '_ \| | | '_ \ / _ \ | 
//  ___) |  / | | | |_| | | | |  / |   
// |____/ \___|_| |_|\|_|_| |_|\___|_| 
// ********************************    
