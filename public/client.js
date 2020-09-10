window.addEventListener('load', () => {
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
});
