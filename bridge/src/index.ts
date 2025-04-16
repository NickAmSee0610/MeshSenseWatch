import WebSocket from 'ws';
import { XMLParser } from 'fast-xml-parser';
import config from 'config';
import axios from 'axios'
import { LocalStorage } from "node-localstorage";

const url=config.get('api.url')
const port = config.get('api.port');
const fetchInterval=config.get('fetchInterval');
const rss_channel =config.get("rss.channel");
const localStorage = new LocalStorage('runtimeData');

console.log("Using port %s",port);
var lastLoad=0;
var ws = new WebSocket("ws://127.0.0.1:"+port+"/ws");
ws.on('open', (wse: WebSocket) => {
  console.log('New client connected');
  ws.send("deviceConfig")
})
ws.on('error', (ws: WebSocket) => {
  console.log(JSON.stringify(ws));
})
ws.on('message', (data:String,isBinary:boolean) => {
  const message = isBinary ? data : data.toString();
  data=JSON.parse(message)
})

  
  async function fetchRssFeed(url: string): Promise<void> {

    const lastLoadTime=new Date()
    lastLoadTime.setTime(localStorage.getItem('rss_lastLoadTime'));

    
    try {  

        const res = await fetch(url);
              const headerDate = res.headers && res.headers.get('date') ? res.headers.get('date') : 'no response date';     
              var data = await res.text();
              data=data.replace("rdf:RDF", "rdfRDF");
              const parser = new XMLParser();
              const json=parser.parse(data);
              let items=null;
              if(json.rdfRDF==undefined){
                
                items=json.rss.channel.item;
              }else{
                items=json.rdfRDF.item;
              }
              if(items!=null){ 
              
              items.forEach((item)=>{
                let message=item.title;
                const pubDate=Date.parse(item.pubDate);

                
                let payload = { message };
                payload['channel'] = rss_channel;

                //console.log(lastLoadTime.getTime());
                
                if(pubDate>lastLoadTime.getTime()){
                  console.log("New message sent %s",message);
                  axios.post("http://127.0.0.1:"+port+'/send', payload).then(() => {
                  
                  })
                }
              
            

              });
            }

    } catch (error) {
      console.error('Error fetching the RSS feed:', error);
      throw new Error('Failed to fetch RSS feed');
    }

  }



  setInterval(() => {
    console.log("Checking new feeds");
    const feeds=config.get("rss.feeds");
    feeds.forEach((feed)=>{
      console.log("Loading feed: %s",feed.url);
      fetchRssFeed(feed.url);
      
    });
    localStorage.setItem("rss_lastLoadTime",Date.now());
  }, 60000*fetchInterval);

  
