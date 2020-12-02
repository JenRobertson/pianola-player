let ctx, captureArea, sampler;
const WIDTH = 640;
const INTERVAL = 10;
const MIN_BLACK_PIXEL_COUNT = 0;
const HEIGHT_OF_CAPTURE_AREA = 5;     //height in pixels of Calibration Detect area

const PERFECT = 12 * WIDTH/640;       //bigger moves capture boxes to the left
const SERVOWIDTH = 50 * WIDTH/640;    //previously 50
let calibrationNumbers = document.getElementById("calibrationNumbers");
//var element = document.getElementById("calibrationNumbers");

const SCALE = WIDTH/640;
//const Y = 305;                       //yposition for the Calibration Detect area

//const video = document.querySelector('video');
//const canvas = document.querySelector('canvas');
//const ctx = canvas.getContext('2d');
let calibrationArray = [0,1,2,3,4,5,6,7,8,9];
//let calibrationNumbers = "";






window.addEventListener('load', () => {
    setUpMotor();
    
    if (WIDTH==640) 
        {calibrationNumbers = document.getElementById("calibrationNumbers640")}
    if (WIDTH==1280) 
        {calibrationNumbers = document.getElementById("calibrationNumbers1280")}
        
        
    buttonAddCaptureArea.onclick = () => {
        if (captureArea) captureArea.stop();
        
    let calibrationNumbers = document.getElementById("calibrationNumbers");    
   // let calibrationNumbers = "";                
    captureArea = new CaptureArea({calibrationNumbers: calibrationNumbers.value, y: parseInt(sliderY.value)});
    }
    
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
        canvas.width = WIDTH;
        canvas.height = 480;
        setInterval(interval, INTERVAL);
        
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
            if(!captureArea) return;
            const starti = (WIDTH * 4) * captureArea.y;
            const endi = starti + (WIDTH * 4 * HEIGHT_OF_CAPTURE_AREA);

            // make pixels black or white
            for (let i = starti; i < endi; i++) {
                let element = pixels.data[i];
                if (element < sliderClamp.value) {
                    pixels.data[i] = 0;
                } else {
                    pixels.data[i] = 255;
                }
            }
        }
        
        ctx.putImageData(pixels, 0, 0);
        if(captureArea) {
            // check segments
            if (checkboxSound.checked){
                captureArea.checkSegments();
            }
            captureArea.draw();
        }
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

class Servo {
    constructor({x, y, width, perfect}) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.perfect = perfect;
        this.offset = 0;
    }
    check() {
        const pixels = ctx.getImageData(this.x, this.y, this.width, 1).data;
        for (let i = 0; i < pixels.length; i+= 4) {
            if (pixels[i] === 255) { // is white 
                const edge = i / 4;
                this.offset = edge - this.perfect;
                return;
            }
        }
        // It all seems to be black, give up!
        this.offset = this.perfect;
    }
}

class CaptureArea {
    constructor({calibrationNumbers, y}) {
        this.servo = new Servo({x: 0, y, width: SERVOWIDTH, perfect: (PERFECT - (document.getElementById("alignCapture").value))});  //PERFECT
        
        this.calibrationNumbers = calibrationNumbers.split(' ');
        if (this.calibrationNumbers.length < 89){
            alert('Please enter 89 numbers (one extra for with of 88th)');
            return;
        } 
        this.servoInterval = setInterval(this.checkServo.bind(this), 1000);

        this.y = y;
        this.segments= [];
        this.createSegments();
        ctx.strokeStyle = "#FF0000";
        ctx.lineWidth = 0.5;
        this.x = this.segments[0];
        this.endX = this.segments[88];
    }
    stop() {
        clearInterval(this.servoInterval)
    }
    createSegments() {
        for (let i = 0; i < 88; i++) {
            this.segments.push(new Segment({
                servo: this.servo,
                keyNumber: i,
                frequency: getFrequencyFromPianoNumber(i),
                x: parseInt(this.calibrationNumbers[i]), 
                width: parseInt(this.calibrationNumbers[i + 1]) - parseInt(this.calibrationNumbers[i]),
                y: this.y
            }));
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
    checkServo() {
        this.servo.check();
    }
}

class Segment {
    constructor({servo, keyNumber, frequency, x, y, width}) {
        this.servo = servo;
        this.keyNumber = keyNumber;
        this.frequency = frequency;
        this.originalX = x;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = HEIGHT_OF_CAPTURE_AREA;

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
        this.x = this.originalX + this.servo.offset;
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
        return blackPixelCount > MIN_BLACK_PIXEL_COUNT;
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

//..............................................

//https://github.com/webrtc/samples/blob/gh-pages/src/content/getusermedia/canvas/js/main.js

//const WIDTH = 640;
//const SCALE = WIDTH/640;
//const Y = 305;         //yposition for the Calibration Detect area
//const HEIGHT_OF_CAPTURE_AREA = 7;     //height in pixels of Calibration Detact area
//const video = document.querySelector('video');
//const canvas = document.querySelector('canvas');
//const ctx = canvas.getContext('2d');
//let calibrationArray = [0,1,2,3,4,5,6,7,8,9];
//let calibrationNumbers = "";
//let Y = parseInt(sliderY.value);

//window.onload = function () {
   

//    navigator.mediaDevices.getUserMedia({audio: false, video: true})
//        .then(function(stream) {
//            video.srcObject = stream;
//            canvas.width = WIDTH;
//            canvas.height = 480;
 //           setInterval(interval, 30);

//        })
//        .catch(function(err) {
//        /* handle the error */
//        alert ("you need to allow the webcam!")
//        });
        
//    const interval = () => 
//      {ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
//       ctx.beginPath();
//       ctx.moveTo(0, Y-1);
//       ctx.lineTo(WIDTH, Y-1);
//       ctx.stroke();   }
//}  //end of the window.onload function
  
  recalibrate.onclick = () => {       // clicking mouse on calibrate button instigates the calibration
        calibrateCaptureArea();

    }

// this is the camera position calibration function
function calibrateCaptureArea() {
    let calibrationNumbers = "";                  //delete old calibration
    let ix,iy,b,blue,finalNumber,finalNumberString;
   // let Y = parseInt(sliderY.value);
   let Y = 340;
    for (ix = 0; ix < WIDTH; ix++) {              //ix to scan across the video window    
        blue = 0
        
        for (iy = Y; iy < Y+HEIGHT_OF_CAPTURE_AREA; iy++) {       //for each ix we will measure blue value at several iy
          let imgData = ctx.getImageData(ix,iy,1,1); //read a single pixel to a four number array
          b=imgData.data[1];                         //blue is the second value of the array [1]
          blue = blue + b;                           //add up all the blue values of each iy
         // btx.putImageData(imgData, ix, iy-Y);
         }   //end of iy loop
       
        blue = parseInt(blue/HEIGHT_OF_CAPTURE_AREA);             //take average value of blue for this ix
        calibrationArray[ix] = blue;               //and put it in an array
       
    }  //end of ix loop
    
    //calculate a threshold value to distinguish dark from light
        let threshold = 0;
    for (ix = 100 * SCALE; ix<499 * SCALE; ix++) {                       //going to calculate a brightness threshold for white and black
        threshold = threshold + calibrationArray[ix];    //add up lots of values
    }  
        threshold = parseInt(threshold/SCALE/400);     //and take the average
        //alert (threshold)      
        //going to convert all the blue values to ones or zeros
        //1 represents bright and 0 represents dark
    for (ix = 0; ix<WIDTH; ix++) {
        if (calibrationArray[ix] >= threshold) 
        {calibrationArray[ix] = 1;}
        else
        {calibrationArray[ix] = 0;}
    }  //end of ix loop
        
        //this is it: Lets generate some calibration numbers
  var lastfound = 0;            
  var previouslyfound = 0;
  for (ix = 30 * SCALE ; ix<638 * SCALE; ix++) 
     {      
     var   ixstring = ix.toString();
     var thispixel = calibrationArray[ix];
     var nextpixel = calibrationArray[ix+1];
      if (thispixel == 1) 
      {
      if (nextpixel == 0)
       {
       calibrationNumbers = calibrationNumbers.concat(ixstring);
       calibrationNumbers = calibrationNumbers.concat(" ");
       previouslyfound = lastfound;
       lastfound = ix;
       }   // end of inner if
      }   //end of outer if
       }  //end of for loop
       
       //so now we have to add one more number to the end to make 89 numbers
       // decided to just add the same distance as for the previous note
       finalNumber = lastfound * 2 - previouslyfound; //calculate what the last number needs to be
       finalNumberString = finalNumber.toString();    //convert it to a string
       calibrationNumbers = calibrationNumbers.concat(finalNumberString); //and add it to the end of the calibrationNumbers
    
      let element = document.getElementById("calibrationNumbers");
      element.innerHTML = calibrationNumbers;

    
      
        
}  //end of calibrateCaptureArea function

