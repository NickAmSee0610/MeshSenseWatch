import 'dotenv/config'
import './lib/persistence'
import { app, createRoutes, finalize, server } from './lib/server'
import './meshtastic'
import { connect, disconnect, deleteNodes, requestPosition, send, traceRoute, setPosition, deviceConfig,toggleWatch } from './meshtastic'
import { connectionStatus,address, apiPort, currentTime, apiHostname, accessKey, autoConnectOnStartup, meshSenseNewsDate,warnChannel,warnNodes, nodes,warnInterval,warnOfflineTime,warnResumeMessage, warnWarningTime } from './vars'
import { hostname } from 'os'
import intercept from 'intercept-stdout'
import { createWriteStream } from 'fs'
import { dataDirectory } from './lib/paths'
import { join } from 'path'
import axios from 'axios'

function timeAgo(seconds) {
  const intervals = [
    { value: 31536000, unit: 'y' },
    { value: 86400, unit: 'd' },
    { value: 3600, unit: 'h' },
    { value: 60, unit: 'm' }
  ]

  for (const interval of intervals) {
    const quotient = Math.floor(seconds / interval.value)
    if (quotient >= 1) {
      return `${quotient}${interval.unit}`
    }
  }

  return `now`
}

function checkWarnNodes(){
  if(connectionStatus.value!="connected"){
    console.log("Not connected... Waiting")
    return
  }
  const sendToNode=nodes.value.find((node)=>node.num==Number(warnChannel.value))!=undefined;
  var sendChannel=null
  var sendNode=null
  if(sendToNode){
    sendNode=warnChannel.value
  }else{
    sendChannel=warnChannel.value  
  }
  warnNodes.value.forEach(warnNode => {
    
  if((Date.now()-warnNode.lastWarningSent)/1000>60*warnInterval.value){
    const foundNode=nodes.value.find((node) => node.num === warnNode.nodeNum);
    if(foundNode==undefined){
      
      send({message:warnNode.nodeName+" not found",destination:sendNode,channel:sendChannel,wantAck:false})
      warnNode.lastWarningSent=Date.now()
      warnNode.wasOffline=true
    }else
    if((Date.now()/1000-foundNode.lastHeard)>60*warnOfflineTime.value){
      send({message:warnNode.nodeName+" offline. Last heard "+Math.round(((Date.now()/1000-foundNode.lastHeard)/60))+" minutes ago",destination:sendNode,channel:sendChannel,wantAck:false})
      warnNode.lastWarningSent=Date.now()
      warnNode.wasOffline=true
      requestPosition(foundNode.num)
    }else
    if((Date.now()/1000-foundNode.lastHeard)>60*warnWarningTime.value){
      console.log('Node reached warning time. Calling')
      requestPosition(foundNode.num)
    }else
    if(warnNode.wasOffline && warnResumeMessage){
      send({message:warnNode.nodeName+" is online again",destination:sendNode,channel:sendChannel,wantAck:false}) 
      warnNode.wasOffline=false    
    }
  }else{

  }

})
}

setInterval(() => {currentTime.set(Date.now())
  checkWarnNodes()
  }
  , 15000)

process.on('uncaughtException', (err, origin) => {
  console.error('[system] Uncaught Exception', err)
})

let consoleLog = []
let logSize = 1000

let lastLogStream = createWriteStream(join(dataDirectory, 'lastLog.txt'))
intercept(
  (text) => {
    lastLogStream.write(text)
    consoleLog.push(text)
    while (consoleLog.length >= logSize) consoleLog.shift()
  },
  (err) => {
    if (err.includes('Possible EventTarget memory leak detected')) return
    consoleLog.push(err)
    while (consoleLog.length >= logSize) consoleLog.shift()
  }
)

createRoutes((app) => {
  app.post('/send', (req, res) => {
    let message = req.body.message
    let destination = req.body.destination
    let channel = req.body.channel
    let wantAck = req.body.wantAck
    send({ message, destination, channel, wantAck })
    return res.sendStatus(200)
  })

  app.post('/traceRoute', async (req, res) => {
    let destination = req.body.destination
    await traceRoute(destination)
    return res.sendStatus(200)
  })

  app.post('/requestPosition', async (req, res) => {
    let destination = req.body.destination
    await requestPosition(destination)
    return res.sendStatus(200)
  })

  app.post('/deleteNodes', async (req, res) => {
    let nodes = req.body.nodes
    await deleteNodes(nodes)
  })

  app.post('/connect', async (req, res) => {
    console.log('[express]', '/connect')
    connect(req.body.address || address.value)
    return res.sendStatus(200)
  })

  app.post('/disconnect', async (req, res) => {
    console.log('[express]', '/disconnect')
    disconnect()
    return res.sendStatus(200)
  })

  app.get('/consoleLog', async (req, res) => {
    if (req.query.accessKey != accessKey.value && req.hostname.toLowerCase() != 'localhost') return res.sendStatus(403)
    return res.json(consoleLog)
  })

  app.get('/deviceConfig', async (req, res) => {
    if (req.query.accessKey != accessKey.value && req.hostname.toLowerCase() != 'localhost') return res.sendStatus(403)
    return res.json(deviceConfig)
  })

  app.post('/position', async (req, res) => {
    console.log('[express]', '/position', req.body)
    setPosition(req.body)
    return res.sendStatus(200)
  })

  app.post('/toggleWatch', async (req, res) => {
    console.log('[express]', '/toggleWatch', req.body.nodeNum)
    toggleWatch(Number(req.body.nodeNum))
    return res.sendStatus(200)
  })

  //** Set accessKey via environment variable */
  if (process.env.ACCESS_KEY) {
    accessKey.set(process.env.ACCESS_KEY)
  }

  //** Capture current hostname and port */
  apiHostname.set(hostname())
  apiPort.set((server.address() as any)?.port)
  if(process.env.NODE_URL){
	console.log('Node URL set');
	connect(process.env.NODE_URL);
  }else{
  	console.log('No node url set');
  }
  // ** Check News Update */
  function checkForNews() {
    console.log('[news] Checking for news')
    axios
      .get('https://affirmatech.com/meshSenseNewsDate')
      .then((newDate) => {
        if (meshSenseNewsDate.value < newDate.data) {
          meshSenseNewsDate.set(newDate.data)
        }
      })
      .catch(() => {
        console.log('[news] Unable to get latest news')
      })
  }

  checkForNews()

  if (autoConnectOnStartup.value && address.value) connect(address.value)
})
