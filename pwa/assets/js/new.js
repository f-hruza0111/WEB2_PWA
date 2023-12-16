import {get, set} from "https://cdn.jsdelivr.net/npm/idb-keyval@6/+esm"




let pictureUploaded = false
const video = document.getElementById("video")
const canvas = document.getElementById("canvas")
const snap = document.getElementById("snap")
const form = document.getElementById("form")
const fileUpload = document.getElementById("file-upload")
const title = document.getElementById("title")
const description = document.getElementById("description")
const upload = document.getElementById("upload")

const  constraints = {
    audio: false,
    video: true
}


async function startTakingPicture() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints)
        video.srcObject = stream;
        window.stream = stream;
        video.style.display = "block"
        snap.style.display = "block"
        fileUpload.style.display = "none"
    } catch(e){
        //omoguci file upload
        // console.log(upload)
        upload.addEventListener('change', (e) => {
            // console.log("Drawing uploaded image")
            const imageFile = upload.files[0]
            // console.log(imageFile)
            const image = new Image()
            image.src = URL.createObjectURL(imageFile)
            image.onload = function() {
                // console.log("Image upload")
                pictureUploaded = true
                canvas.style.display = "block"
                
                var ctx = canvas.getContext('2d')
                ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
            }
        })
    }
}


var ctx = canvas.getContext('2d')

snap.addEventListener('click', () => {
    canvas.style.display = "block"
    canvas.width = video.getBoundingClientRect().width;
    canvas.height = video.getBoundingClientRect().height
    video.style.display = "none"
    snap.style.display = "none"

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    
})

form.addEventListener('submit', (e) => {
    e.preventDefault()
    if ("serviceWorker" in navigator && "SyncManager" in window) {
        fetch(canvas.toDataURL())
        .then((res) => res.blob())
        .then((blob) =>
        {

            // console.log(title.value)
            // console.log(description.value)
            let ts = new Date().toISOString();
            let id = ts + title.value.replace(/\s/g, "_");
            set(id, {id: id, title: title.value, description: description.value, image: blob });
            return navigator.serviceWorker.ready;

        }).then((swRegistration) =>{
            return swRegistration.sync.register("sync-trinket");

        }).then(() =>{
            console.log("Queued for sync");
            startTakingPicture()
        })
        .catch((err) => { console.log(err); });
    } else {
        //ignore
    }
})


startTakingPicture()