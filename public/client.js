let ctx, captureArea, sampler;
window.addEventListener('load', () => {
    setUpMotor();
    captureArea = new CaptureArea({startX: 10, endX: 630});
    sampler = new Tone.Sampler({
        urls: getUrls(),
        baseUrl: "audio/piano/",
        release: 0.5,
        onload: () => {
            showWebcam();
        }
    }).toDestination();
});


function showWebcam() {
    const video = document.querySelector('video');
    const canvas = document.querySelector('canvas');
    ctx = canvas.getContext('2d');
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
        captureArea.draw();
        if (checkboxSound.checked) captureArea.checkSegments();
    }
}

function setUpMotor() {
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

class CaptureArea {
    constructor({startX, endX}) {
        this.startX = startX;
        this.endX = endX;
        this.width = endX - startX;
        this.segmentWidth = this.width / 88;
        this.segments= [];
        this.createSegments();
    }
    createSegments() {
        let currentX = this.startX;
        for (let i = 1; i <= 88; i++) {
            this.segments.push(new Segment({
                keyNumber: i,
                frequency: getFrequencyFromPianoNumber(i),
                x: currentX, 
                width: this.segmentWidth,
            }));
            currentX += this.segmentWidth;
        };
    }
    checkSegments() {
        for (let i = 0; i < this.segments.length; i++) {
            this.segments[i].check();
        }
    }
    draw() {
        ctx.beginPath();
        for (let i = 0; i < this.segments.length; i++) {
            const segment = this.segments[i];
            ctx.rect(segment.x, segment.y, segment.width, segment.height);
        }
        // x y width height
        ctx.closePath();
        ctx.stroke();
    }
}

class Segment {
    constructor({keyNumber, frequency, x, width}) {
        this.keyNumber = keyNumber;
        this.frequency = frequency;
        this.x = x;
        this.y = 20;
        this.width = width;
        this.height = 4;

        this.playing = false;
    }
    startNote () {
        sampler.triggerAttack(this.frequency);
        this.playing = true;
    }
    stopNote () {
        sampler.triggerRelease(this.frequency);
        this.playing = false;
    }
    check () {
        if (this.isBlack() !== this.playing) { // state has changed
            this.isBlack() ? this.startNote() : this.stopNote();
        }
    }
    isBlack() {
        const pixels = ctx.getImageData(this.x, this.y, this.width, this.height).data;
        let blackPixelCount = 0;
        for (let i = 0; i < pixels.length; i++) {
            if (pixels[i] === 0) blackPixelCount++;
        }
        return blackPixelCount > 16;
    }
  }

function getFrequencyFromPianoNumber(note) {
    // +20 to convert from midi to piano note
    return (440 * Math.pow(2,(note-69 +20)/12)) ;
} 

function getUrls() {
    return {
        A0: "A0.mp3",
        A1: "A1.mp3",
        A2: "A2.mp3",
        A3: "A3.mp3",
        A4: "A4.mp3",
        A5: "A5.mp3",
        A6: "A6.mp3",
        
        'A#0': "As0.mp3",
        'A#1': "As1.mp3",
        'A#2': "As2.mp3",
        'A#3': "As3.mp3",
        'A#4': "As4.mp3",
        'A#5': "As5.mp3",
        'A#6': "As6.mp3",
        
        B0: "B0.mp3",
        B1: "B1.mp3",
        B2: "B2.mp3",
        B3: "B3.mp3",
        B4: "B4.mp3",
        B5: "B5.mp3",
        B6: "B6.mp3",
        
        C0: "C0.mp3",
        C1: "C1.mp3",
        C2: "C2.mp3",
        C3: "C3.mp3",
        C4: "C4.mp3",
        C5: "C5.mp3",
        C6: "C6.mp3",
        
        'C#0': "Cs0.mp3",
        'C#1': "Cs1.mp3",
        'C#2': "Cs2.mp3",
        'C#3': "Cs3.mp3",
        'C#4': "Cs4.mp3",
        'C#5': "Cs5.mp3",
        'C#6': "Cs6.mp3",
        
        D0: "D0.mp3",
        D1: "D1.mp3",
        D2: "D2.mp3",
        D3: "D3.mp3",
        D4: "D4.mp3",
        D5: "D5.mp3",
        D6: "D6.mp3",
        
        'D#0': "Ds0.mp3",
        'D#1': "Ds1.mp3",
        'D#2': "Ds2.mp3",
        'D#3': "Ds3.mp3",
        'D#4': "Ds4.mp3",
        'D#5': "Ds5.mp3",
        'D#6': "Ds6.mp3",
        
        E0: "E0.mp3",
        E1: "E1.mp3",
        E2: "E2.mp3",
        E3: "E3.mp3",
        E4: "E4.mp3",
        E5: "E5.mp3",
        E6: "E6.mp3",
        
        F0: "F0.mp3",
        F1: "F1.mp3",
        F2: "F2.mp3",
        F3: "F3.mp3",
        F4: "F4.mp3",
        F5: "F5.mp3",
        F6: "F6.mp3",
        
        'F#0': "Fs0.mp3",
        'F#1': "Fs1.mp3",
        'F#2': "Fs2.mp3",
        'F#3': "Fs3.mp3",
        'F#4': "Fs4.mp3",
        'F#5': "Fs5.mp3",
        'F#6': "Fs6.mp3",
        
        G0: "G0.mp3",
        G1: "G1.mp3",
        G2: "G2.mp3",
        G3: "G3.mp3",
        G4: "G4.mp3",
        G5: "G5.mp3",
        G6: "G6.mp3",
        
        'G#0': "Gs0.mp3",
        'G#1': "Gs1.mp3",
        'G#2': "Gs2.mp3",
        'G#3': "Gs3.mp3",
        'G#4': "Gs4.mp3",
        'G#5': "Gs5.mp3",
        'G#6': "Gs6.mp3",
    }
}