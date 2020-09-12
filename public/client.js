window.addEventListener('load', () => {
    setUpButtons();
    showWebcam();
    const pianoButton = document.getElementById('piano');
    const sampler = new Tone.Sampler({
        urls: {
            A1: "A1.mp3",
            A2: "A2.mp3",
            C1: "C1.mp3",
        },
        baseUrl: "audio/piano/",
        onload: () => {
            
        }
    }).toDestination();
    
    pianoButton.onclick = () => {
        // sampler.triggerAttackRelease(["C1"]);
        sampler.triggerAttack("C4");
        window.setTimeout(() => {
            alert('poo')
            sampler.triggerRelease("C4");
        }, 1000)
// wait one second before triggering the release
    }
});

function showWebcam () {
    const video = document.querySelector('video');
    const canvas = document.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    const sliderClamp = document.querySelector('#sliderClamp');
    const sliderBrightness = document.querySelector('#sliderBrightness');
    const sliderContrast = document.querySelector('#sliderContrast');
    const checkboxClamp = document.querySelector('#checkboxClamp');
    const checkboxFilters = document.querySelector('#checkboxFilters');

    navigator.mediaDevices.getUserMedia({audio: false, video: true})
        .then(function(stream) {
            video.srcObject = stream;
            canvas.width = 640;
            canvas.height = 480;
            setInterval(interval, 30);

        })
        .catch(function(err) {
        /* handle the error */
        });
        
        const interval = () => {
            if(checkboxFilters.checked) {
                ctx.filter = `brightness(${sliderBrightness.value}%) contrast(${sliderContrast.value}%) grayscale(${checkboxClamp.checked ? 1 : 0})`;
            } else {
                ctx.filter = 'none';
            }
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
            const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
            if (checkboxClamp.checked){
                for (let i = 0; i < pixels.data.length; i++) {
                    let element = pixels.data[i];
                    if (element < sliderClamp.value){
                        pixels.data[i] = 0;
                    } else {
                        pixels.data[i] = 255;
                    }
                }
            }
    
            ctx.putImageData(pixels,0,0);
        }
    }
    
    function setUpButtons () {
        const socket = io('http://localhost:3000');
    
        const forwardsButton = document.getElementById('forwards');
        const reverseButton = document.getElementById('reverse');
        const stopButton = document.getElementById('stop');
    
        forwardsButton.onclick = () => {
            socket.emit('forwards');
        }
    
        reverseButton.onclick = () => {
            socket.emit('reverse');
        }
    
        stopButton.onclick = () => {
            socket.emit('stop');
        }
    }
    
    // webcam functions

// function getPixelsFromArea(ctx, sx, sy, sw, sh){
//     return getEveryNth(ctx.getImageData(sx,sy,sw,sh).data); 
// }

// function getAverageBrightnessOfArea(ctx, sx, sy, sw, sh){
//     return average(getPixelsFromArea(ctx, sx, sy, sw, sh));
// }

// function average(nums) {
//     return nums.reduce((a, b) => (a + b)) / nums.length;
// }

// function getEveryNth(array){
//     console.log('array', array);
//     return array.filter(function(value, index, Arr) {
//         return index % 4 == 0;
//     });
// }
