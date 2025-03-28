import CarplayWeb, {
  CarplayMessage,
  DongleConfig,
  SendAudio,
  SendCommand,
  SendTouch,
  findDevice
} from 'node-carplay/web'
import { Command } from '../components/worker/types'



let carplayWeb: CarplayWeb | null = null
let config: Partial<DongleConfig> | null = null

const handleMessage = (message: CarplayMessage) => {
  const { type, message: payload } = message
  console.log(message)
  console.log("test")
  //console.log("Message type: ", type, " Message: ", message)
  if (type === 'video') {
    postMessage(message, [payload.data.buffer])
  } else if (type === 'audio' && payload.data) {
    postMessage(message, [payload.data.buffer])
  } else if (type === 'media') {
    if (payload.payload?.media?.MediaSongName) {
      console.log(payload.payload.media.MediaSongName)
      console.log(payload.payload.media.MediaAlbumName)
      console.log(payload.payload.media.MediaArtistName)
      console.log(payload.payload.media.MediaAPPName)
    }
    postMessage(message)
  } else {
    postMessage(message)
  }
}


onmessage = async (event: MessageEvent<Command>) => {
  console.log(event.data)
  switch (event.data.type) {
    case 'start':
      if (carplayWeb) return
      config = event.data.payload
      const device = await findDevice()
      if (device) {
        carplayWeb = new CarplayWeb(config)
        carplayWeb.onmessage = handleMessage
        carplayWeb.start(device)
      }
      break
    case 'touch':
      if (config && carplayWeb) {
        const { x, y, action } = event.data.payload
        const data = new SendTouch(x, y, action)
        carplayWeb.dongleDriver.send(data)
      }
      break
    case 'stop':
      await carplayWeb?.stop()
      carplayWeb = null
      break
    case 'microphoneInput':
      if (carplayWeb) {
        const data = new SendAudio(event.data.payload)
        carplayWeb.dongleDriver.send(data)
      }
      break
    case 'frame':
      if (carplayWeb) {
        const data = new SendCommand('frame')
        carplayWeb.dongleDriver.send(data)
      }
  }
}

export {}
