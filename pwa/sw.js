
import { del, entries } from "https://cdn.jsdelivr.net/npm/idb-keyval@6/+esm";



const toCache = [
    "/",
    "/manifest.json",
    "/index.html",
    "/offline.html",
    "/404.html",
    "/new.html",
    "assets/js/new.js",
    "assets/css/style.css",
    "https://cdn.jsdelivr.net/npm/idb-keyval@6/+esm",
    "https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" ,
    "https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js" ,
    'https://cdn.jsdelivr.net/npm/dotenv@16.3.1/lib/main.min.js'
]

const staticCache = "static-file-cache"



self.addEventListener('install', async (event) => {
    console.log("Installing SW and caching static resources")
    event.waitUntil(
        caches.open(staticCache).then((cache) => {
            return cache.addAll(toCache)
        })
    )

    
})

self.addEventListener('activate', async event => {
    console.log(
        "*************************************************************************************"
    );
    console.log(
        "******************   Activating new service worker... *******************************"
    );
    console.log(
        "*************************************************************************************"
    );

    const cacheWhitelist = [staticCache];
   
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );

    
    

        
})


self.addEventListener('online', async () => {
    await syncTrinkets()
})

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches
            .match(event.request)
            .then((response) => {
                //data.json dohvati iz cachea samo ako nema konekcije
                if(response && !navigator.onLine && event.request.url.indexOf('data.json') > -1){
                    return response
                }

                if (response && event.request.url.indexOf('data.json') <= -1) {
                    console.log("Found " + event.request.url + " in cache!");
                    return response
                }
               
                return fetch(event.request).then((response) => {
                    // console.log("response.status = " + response.status);
                    if (response.status === 404) {
                        return caches.match("404.html");
                    }

                    return caches.open(staticCache).then((cache) => {
                        console.log("Caching to dynamic cache: " + event.request.url);
                        cache.put(event.request.url, response.clone());
                        return response;
                    });

                    

                });
            })
            .catch((error) => {
                console.log("Error", event.request.url, error);

               
                return caches.match("offline.html");
            })
    );


})

self.addEventListener('push', e => {
    const data = e.data.json()
    console.log('Push received by SW');
    self.registration.showNotification(data.title, {
        body: data.text
    })
})


self.addEventListener("sync", (event) => {
    console.log('BG syncing...', event);
    if (event.tag === "sync-trinket") {
        event.waitUntil(
            syncTrinkets()
        );
    } else {
        console.log("Thats fake")
    }

})

self.addEventListener('periodicsync', function(event) {
    console.log('Starting periodic sync...')
    if (event.tag === 'syncData') {
      event.waitUntil(syncTrinkets());
    }
  });

async function syncTrinkets() {
    console.log('Syncing trinket upload requests')
    let synced = false;
    entries()
        .then((entries) => {
            entries.forEach((entry) => {
                let trinket = entry[1]; 
                // console.log(trinket.id)
                // console.log(trinket.title)
                // console.log(trinket.description)
                // console.log(trinket.image)
                

                let formData = new FormData();
                formData.append('id', trinket.id);
                formData.append('description', trinket.description);
                formData.append('title', trinket.title);
                formData.append('image', trinket.image, trinket.id + '.png');


               
                fetch('/new', {
                        method: 'POST',
                        body: formData
                    })
                    .then(function (res) {

                        if (res.ok) {
                            synced = true;

                            res.json()
                                .then(function (data) {
                                    console.log("Deleting from idb:", data.id);
                                    del(data.id);
                                });

                        } else {
                            synced = false
                            console.log(res);
                        }
                    })
                    .catch(function (error) {
                        synced = false
                        console.log(error);
                    });
            })
        });
    
      
        const sub = self.registration.pushManager.getSubscription()

        // console.log('Sending sync notification')
        fetch('/sync', {
            method: 'POST',
            body: JSON.stringify(sub),
            headers: {
                'content-type': 'application/json'
            }
        }).then(() => {
            // console.log('Push subscription sent')
        }).catch((e) => {
            console.log("Error while sendind sync push", e)
        })
}
 
