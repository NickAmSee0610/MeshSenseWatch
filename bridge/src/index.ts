import WebSocket from 'ws';
import config from 'config';
import axios from 'axios'
import { LocalStorage } from "node-localstorage";
import Parser from 'rss-parser'

const api_url=config.get('api.url')
const port = config.get('api.port');
const fetchInterval=config.get('fetchInterval');
const rss_channel =config.get("rss.channel");
const localStorage = new LocalStorage('runtimeData');
/* For future implementations
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
})*/

  
  async function fetchRssFeed(url: string): Promise<void> {

    const lastLoadTime=new Date()
    lastLoadTime.setTime(localStorage.getItem('rss_lastLoadTime'));

    
    try {  
      const rssparser=new Parser;
      rssparser.parseURL(url, function(err, feed) {
        feed.items.forEach(function(entry) {
          let message=entry.title;
          const pubDate=Date.parse(entry.pubDate);
          let payload = { message };
          payload['channel'] = rss_channel;
          if(pubDate>lastLoadTime.getTime()){
            console.log("New message sent %s",message);
            axios.post("http://"+api_url+":"+port+'/send', payload).then(() => {});
          }
        })
      })
        

    } catch (error) {
      console.error('Error fetching the RSS feed:', error);
    }

  }


  function loadFeeds(){
    console.log("%o - Checking new feeds",new Date());
    const feeds=config.get("rss.feeds");
    feeds.forEach((feed)=>{
      console.log("Loading feed: %s",feed.url);
      fetchRssFeed(feed.url);
      
    });
    localStorage.setItem("rss_lastLoadTime",Date.now());
  }

  setInterval(() => {
    loadFeeds();
  }, 60000*fetchInterval);

  
