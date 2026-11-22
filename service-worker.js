const APP_SCOPE="/e-bike-presentation-/";
self.addEventListener("push",event=>{
  let data={};
  try{data=event.data?event.data.json():{};}catch(_){}
  const title=data.title||"Neue Unterstützungs-Meldung";
  const options={
    body:data.body||"Eine neue Beitragsmeldung wartet auf Prüfung.",
    icon:APP_SCOPE+"bilder/bike-titel.jpeg",
    badge:APP_SCOPE+"bilder/bike-titel.jpeg",
    data:{url:data.url||APP_SCOPE},
    tag:"support-contribution",
    renotify:true
  };
  event.waitUntil(self.registration.showNotification(title,options));
});
self.addEventListener("notificationclick",event=>{
  event.notification.close();
  const target=new URL(event.notification.data?.url||APP_SCOPE,self.location.origin).href;
  event.waitUntil((async()=>{
    const windows=await self.clients.matchAll({type:"window",includeUncontrolled:true});
    for(const client of windows){
      if("focus" in client){await client.focus();if("navigate" in client)await client.navigate(target);return;}
    }
    if(self.clients.openWindow)await self.clients.openWindow(target);
  })());
});