window.addEventListener('load', () => {
    setUpButtons();
    showWebcam();
});

function showWebcam () {
    const video = document.querySelector('video');
    const canvas = document.querySelector('canvas');
    const box = document.querySelector('#box');
    const ctx = canvas.getContext('2d');
    const slider = document.querySelector('#slider');

    navigator.mediaDevices.getUserMedia({audio: false, video: true})
        .then(function(stream) {
            video.srcObject = stream;
            canvas.width = 320;
            canvas.height = 240;
            setInterval(interval, 30);

        })
        .catch(function(err) {
        /* handle the error */
        });
        
    const interval = () => {
        ctx.filter = 'grayscale(100%)';
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < pixels.data.length; i++) {
            let element = pixels.data[i];
            if (element < slider.value){
                pixels.data[i] = 0;
            } else {
                pixels.data[i] = 255;
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

function getPixelsFromArea(ctx, sx, sy, sw, sh){
    return getEveryNth(ctx.getImageData(sx,sy,sw,sh).data); 
}

function getAverageBrightnessOfArea(ctx, sx, sy, sw, sh){
    return average(getPixelsFromArea(ctx, sx, sy, sw, sh));
}

function average(nums) {
    return nums.reduce((a, b) => (a + b)) / nums.length;
}

function getEveryNth(array){
    return array.filter(function(value, index, Arr) {
        return index % 4 == 0;
    });
}
