const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 3000;
const Gpio = require('onoff').Gpio;

const Motor0 = new Gpio(4, 'out'); //use GPIO pin 4 as output
const Motor1 = new Gpio(6, 'out'); //use GPIO pin 6 as output to make motor go

http.listen(port, function(){
    stop();
  console.log('listening on *:' + port);
});

app.use(express.static('public'));

io.on('connection', (socket) => {
    socket.on('forwards', forwards);
    socket.on('reverse', reverse);
    socket.on('stop', stop);
});

const forwards = () => {
    Motor0.writeSync (1);
    Motor1.writeSync (1);
};

const reverse = () => {
    Motor0.writeSync (0);
    Motor1.writeSync (1);
};

const stop = () => {
    Motor0.writeSync (0);
    Motor1.writeSync (0);
};

process.on('SIGINT', function () { //on ctrl+c
    Motor0.writeSync(0);
    Motor0.unexport(); // Unexport LED GPIO to free resources
    process.exit(); //exit completely
});
  