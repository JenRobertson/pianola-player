window.addEventListener('load', () => {
    setUpButtons();
    showWebcam();
    const pianoButton = document.getElementById('piano');
    const sampler = new Tone.Sampler({
        urls: getUrls(),
        baseUrl: "audio/piano/",
        release: 0.5,
        onload: () => {
            
        }
    }).toDestination();
    
    pianoButton.onclick = () => {
        sampler.triggerAttack("F1");
        window.setTimeout(() => {
            sampler.triggerRelease("F1");
        }, 100)
    }
});

function showWebcam() {
    const video = document.querySelector('video');
    const canvas = document.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    const sliderClamp = document.querySelector('#sliderClamp');
    const sliderBrightness = document.querySelector('#sliderBrightness');
    const sliderContrast = document.querySelector('#sliderContrast');
    const checkboxClamp = document.querySelector('#checkboxClamp');
    const checkboxFilters = document.querySelector('#checkboxFilters');
    
    navigator.mediaDevices.getUserMedia({ audio: false, video: true })
    .then(function (stream) {
        video.srcObject = stream;
        canvas.width = 640;
        canvas.height = 480;
        setInterval(interval, 30);
        
    })
    .catch(function (err) {
        /* handle the error */
    });
    
    const interval = () => {
        if (checkboxFilters.checked) {
            ctx.filter = `brightness(${sliderBrightness.value}%) contrast(${sliderContrast.value}%) grayscale(${checkboxClamp.checked ? 1 : 0})`;
        } else {
            ctx.filter = 'none';
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
        if (checkboxClamp.checked) {
            for (let i = 0; i < pixels.data.length; i++) {
                let element = pixels.data[i];
                if (element < sliderClamp.value) {
                    pixels.data[i] = 0;
                } else {
                    pixels.data[i] = 255;
                }
            }
        }
        
        ctx.putImageData(pixels, 0, 0);
    }
}

function setUpButtons() {
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

function getUrls() {
    return {
        A0: "A1.mp3",
        A1: "A1.mp3",
        A2: "A2.mp3",
        A3: "A3.mp3",
        A4: "A4.mp3",
        A5: "A5.mp3",
        A6: "A6.mp3",
        
        'A#0': "As1.mp3",
        'A#1': "As1.mp3",
        'A#2': "As2.mp3",
        'A#3': "As3.mp3",
        'A#4': "As4.mp3",
        'A#5': "As5.mp3",
        'A#6': "As6.mp3",
        
        B0: "B1.mp3",
        B1: "B1.mp3",
        B2: "B2.mp3",
        B3: "B3.mp3",
        B4: "B4.mp3",
        B5: "B5.mp3",
        B6: "B6.mp3",
        
        C0: "C1.mp3",
        C1: "C1.mp3",
        C2: "C2.mp3",
        C3: "C3.mp3",
        C4: "C4.mp3",
        C5: "C5.mp3",
        C6: "C6.mp3",
        
        'C#0': "Cs1.mp3",
        'C#1': "Cs1.mp3",
        'C#2': "Cs2.mp3",
        'C#3': "Cs3.mp3",
        'C#4': "Cs4.mp3",
        'C#5': "Cs5.mp3",
        'C#6': "Cs6.mp3",
        
        D0: "D1.mp3",
        D1: "D1.mp3",
        D2: "D2.mp3",
        D3: "D3.mp3",
        D4: "D4.mp3",
        D5: "D5.mp3",
        D6: "D6.mp3",
        
        'D#0': "Ds1.mp3",
        'D#1': "Ds1.mp3",
        'D#2': "Ds2.mp3",
        'D#3': "Ds3.mp3",
        'D#4': "Ds4.mp3",
        'D#5': "Ds5.mp3",
        'D#6': "Ds6.mp3",
        
        E0: "E1.mp3",
        E1: "E1.mp3",
        E2: "E2.mp3",
        E3: "E3.mp3",
        E4: "E4.mp3",
        E5: "E5.mp3",
        E6: "E6.mp3",
        
        F0: "F1.mp3",
        F1: "F1.mp3",
        F2: "F2.mp3",
        F3: "F3.mp3",
        F4: "F4.mp3",
        F5: "F5.mp3",
        F6: "F6.mp3",
        
        'F#0': "Fs1.mp3",
        'F#1': "Fs1.mp3",
        'F#2': "Fs2.mp3",
        'F#3': "Fs3.mp3",
        'F#4': "Fs4.mp3",
        'F#5': "Fs5.mp3",
        'F#6': "Fs6.mp3",
        
        G0: "G1.mp3",
        G1: "G1.mp3",
        G2: "G2.mp3",
        G3: "G3.mp3",
        G4: "G4.mp3",
        G5: "G5.mp3",
        G6: "G6.mp3",
        
        'G#0': "Gs1.mp3",
        'G#1': "Gs1.mp3",
        'G#2': "Gs2.mp3",
        'G#3': "Gs3.mp3",
        'G#4': "Gs4.mp3",
        'G#5': "Gs5.mp3",
        'G#6': "Gs6.mp3",
    }
}