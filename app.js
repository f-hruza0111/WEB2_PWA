const express = require("express")
const fs = require("fs");
const path = require("path")
const multer = require("multer");
const push = require('web-push')
require('dotenv').config()


const vapKeys =  {
       publicKey: process.env.VAPID_PUB_KEY,
       privateKey: process.env.VAPID_PRIV_KEY
}

push.setVapidDetails('mailto:test@test.com', vapKeys.publicKey, vapKeys.privateKey)

const externalUrl = process.env.RENDER_EXTERNAL_URL
const port = externalUrl && process.env.PORT ? parseInt(process.env.PORT) : 3000
const baseURL = externalUrl || `http://localhost:${port}`

const app = express();


app.use(express.json()); 
app.use(express.urlencoded({extended: true})); 

app.use((req, res, next) => {
    console.log(new Date().toLocaleString() + " " + req.url);
    next();
});



app.use(express.static(path.join(__dirname, "pwa")));

app.get("/", function (req, res) {
    res.sendFile(path.join(__dirname, "pwa", "index.html"));
});

app.post('/subscribe', (req, res) => {
    const subscription = req.body;

    res.status(201).json({})

    const payload = JSON.stringify({title: 'Notification Subscription', text: "You are now able to receive push notifications"})

    push.sendNotification(subscription, payload)
    .catch(e => {
        console.log(e)
    })
})

app.post('/sync', (req, res) => {
    const subscription = req.body;

    res.status(201).json({})

    const payload = JSON.stringify({title: 'Background Sync', text: "Background sync of data was successful"})

    push.sendNotification(subscription, payload)
    .catch(e => {
        console.log(e)
    })
})



app.get('/new', function (req, res) {
    res.sendFile(path.join(__dirname, "pwa", "new.html"));
})

const UPLOAD_PATH = path.join(__dirname, "pwa", "assets", "pictures");
var uploadTrinket = multer({
    storage:  multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, UPLOAD_PATH);
        },
        filename: function (req, file, cb) {
            let fn = file.originalname.replaceAll(":", "-");
            cb(null, fn);
        },
    })
}).single("image");



app.post('/new', function (req, res) {
   //parse form and append to data.json and save trinket image
   uploadTrinket(req, res, async function(err) {
        if(err){
            console.log(err);
            res.json({
                success: false,
                error: {
                    message: 'Upload failed: ' + JSON.stringify(err)
                }
            })

        } else {
            // console.log(req.body);
            //append to json
            let dataFile = fs.readFileSync("./pwa/assets/data.json")
            // console.log(data)

            let data = JSON.parse(dataFile)
            // console.log(data)

            data.push({
                id: req.body.id.replaceAll(":", "-"),
                title: req.body.title,
                description: req.body.description,
                image: req.body.image
            })

            console.log(data)


            dataFile = JSON.stringify(data)
            fs.writeFileSync("./pwa/assets/data.json", dataFile);

            
            res.json({ success: true, id: req.body.id});
            
        }

   })
   
})






if(externalUrl){

    const hostname = '0.0.0.0'
    app.listen(port, hostname, () => {
        console.log(`Server running locally on  http://${hostname}:${port} and externaly on ${externalUrl}`);
    })
} else {
    app.listen(port, () => {
        console.log(`Server running locally on  ${baseURL}`);
    })
}


