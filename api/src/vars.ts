import { State } from './lib/state'

export let version = new State('version', '')
export let headless = new State('headless', '')
export let address = new State('address', '', { persist: 'api' })
export let connectionStatus = new State<'connected' | 'connecting' | 'disconnected' | 'searching' | 'configuring' | 'reconnecting'>('connectionStatus', 'disconnected')
export let lastFromRadio = new State('lastFromRadio', undefined, { hideLog: true })
export let channels = new State<Channel[]>('channels', [], { primaryKey: 'index', hideLog: true })
export let packets = new State<MeshPacket[]>('packets', [], { hideLog: true })
export let nodes = new State<NodeInfo[]>('nodes', [], { primaryKey: 'num', hideLog: true })
export let currentTime = new State<number>('currentTime', Date.now(), { hideLog: true })
export let myNodeNum = new State<number>('myNodeNum')
export let broadcastId = 4294967295
export let myNodeMetadata = new State<DeviceMetadata>('myNodeMetadata')
export let accessKey = new State<string>('accessKey', undefined, { persist: true, hideLog: true })
export let packetLimit = new State<number>('packetLimit', 500, { persist: true })
export let apiHostname = new State<string>('apiHostname', undefined, { hideLog: true })
export let apiPort = new State<string>('apiPort', undefined, { hideLog: true })
export let messagePrefix = new State<string>('messagePrefix', undefined, { persist: true })
export let messageSuffix = new State<string>('messageSuffix', undefined, { persist: true })
export let allowRemoteMessaging = new State<boolean>('allowRemoteMessaging', false, { persist: true })
export let autoConnectOnStartup = new State<boolean>('autoConnectOnStartup', true, { persist: true })
export let enableTLS = new State<boolean>('enableTLS', false, { persist: true })
export let automaticTraceroutes = new State<boolean>('automaticTraceroutes', true, { persist: true })
export let meshSenseNewsDate = new State<number>('meshSenseNewsDate', 0, { persist: true })
export let pendingTraceroutes = new State<number[]>('pendingTraceroutes', [], { hideLog: true })
export let meshMapForwarding = new State<boolean>('meshMapForwarding', false, { hideLog: true, persist: true })
export let warnChannel = new State<string>('warnChannel',undefined,{persist:true})
export let warnInterval = new State<number>('warInterval',15,{persist:true})
export let warnResumeMessage = new State<boolean>('warnResume',false,{persist:true})
export let warnWarningTime = new State<number>('warnWarningTime',15,{persist:true})
export let warnOfflineTime = new State<number>('warnOfflineTime',30,{persist:true})
export let powerWarnings = new State<boolean>('powerWarnings',false,{persist:true})
export let powerThresholdWarning = new State<number>('powerThresholdWarning',20,{persist:true})
export let powerThresholdError = new State<number>('powerThresholdError',10,{persist:true})

export let warnNodes = new State<WarnNode[]>('warnNodes',[],{primaryKey:'nodeNum',persist:true})
/** Measured in minutes */
export let tracerouteRateLimit = new State<number>('tracerouteRateLimit', 60, { persist: true })
export let nodeInactiveTimer = new State<number>('nodeInactiveTimer', 60, { persist: true })

export type WarnNode = {
  nodeNum:number
  nodeName:String
  lastWarningSent:number
  wasOffline:boolean
  powerAlertSent:number
}

export type DeviceMetadata = {
  firmwareVersion: string
  deviceStateVersion: number
  canShutdown: boolean
  hasWifi: boolean
  hasBluetooth: boolean
  hasEthernet: boolean
  role: string
  positionFlags: number
  hwModel: string
  hasRemoteHardware: boolean
}

export type Message = {
  id: number
  rxTime: string
  type: string
  from: number
  to: number
  channel: number
  data: string
  show?: boolean
  decoded?: string
  readable?: string
}

export type User = {
  id: string
  longName: string
  shortName: string
  macaddr: string
  hwModel: string
  isLicensed: boolean
  role: number
}

export type Position = {
  latitudeI: number
  longitudeI: number
  altitude: number
  time: number
  locationSource: number
  altitudeSource: number
  timestamp: number
  timestampMillisAdjust: number
  altitudeHae: number
  altitudeGeoidalSeparation: number
  PDOP: number
  HDOP: number
  VDOP: number
  gpsAccuracy: number
  groundSpeed: number
  groundTrack: number
  fixQuality: number
  fixType: number
  satsInView: number
  sensorId: number
  nextUpdate: number
  seqNumber: number
  precisionBits: number
}

export type DeviceMetrics = {
  batteryLevel: number
  voltage: number
  channelUtilization: number
  airUtilTx: number
  uptimeSeconds?: number
}

export type EnvironmentMetrics = {
  temperature: number
  relativeHumidity: number
  barometricPressure: number
  gasResistance: number
  iaq: number
}

export type NodeInfo = {
  num: number
  snr: number
  lastHeard: number
  channel: number
  viaMqtt: boolean
  hopsAway: number
  isFavorite: boolean
  user: User
  position: Position
  deviceMetrics?: DeviceMetrics
  environmentMetrics?: EnvironmentMetrics
  rssi?: number
  trace?: any
  approximatePosition?: { longitude: number; latitude: number } | false
}

export type ChannelSettings = {
  channelNum: number
  psk: string
  name: string
  id: number
  uplinkEnabled: boolean
  downlinkEnabled: boolean
  moduleSettings: { positionPrecision?: number }
}

export type Channel = {
  index: number
  role: 0 | 1 | 2
  settings: ChannelSettings
}

export type MeshPacket = {
  from: number
  to: number
  channel: number
  encrypted?: string
  decoded?: any
  payloadVariant?: any
  // {
  // case: 'decoded',
  // value: Data {
  //   portnum: 1,
  //   payload: [Uint8Array],
  //   wantResponse: false,
  //   dest: 0,
  //   source: 0,
  //   requestId: 0,
  //   replyId: 0,
  //   emoji: 0
  // }
  id: number
  rxTime: number
  rxSnr: number
  hopLimit: number
  wantAck: boolean
  priority: any
  rxRssi: number
  delayed: any
  viaMqtt: boolean
  hopStart: number
  publicKey?: string
  pkiEncrypted?: boolean
  data?: any
  message?: Message
  deviceMetrics?: DeviceMetrics
  environmentMetrics?: EnvironmentMetrics
  position?: Position
  user?: User
  detectionSensor?: string
  trace?: {
    route: number[]
  }
  routing?: {
    errorReason: string
  }
  neighbors?: {
    nodeId: number
    snr: number
    lastRxTime: number
    nodeBroadcastIntervalSecs: number
  }[]
}
