const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const os = require('os');
const qrcode = require('qrcode-terminal');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files from the root
app.use(express.static(__dirname));

// Route for the remote UI
app.get('/remote', (req, res) => {
    res.sendFile(path.join(__dirname, 'remote.html'));
});

io.on('connection', (socket) => {
    console.log('A client connected:', socket.id);

    // Forward command from remote to presentation
    socket.on('command', (cmd) => {
        console.log('Broadcasting command:', cmd);
        io.emit('remote-command', cmd);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

const PORT = process.env.PORT || 3000;

// Function to get local IP address
function getLocalIp() {
    const interfaces = os.networkInterfaces();
    for (const devName in interfaces) {
        const iface = interfaces[devName];
        for (let i = 0; i < iface.length; i++) {
            const alias = iface[i];
            if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
                return alias.address;
            }
        }
    }
    return 'localhost';
}

const localIp = getLocalIp();
const remoteUrl = `http://${localIp}:${PORT}/remote`;

server.listen(PORT, () => {
    console.log(`\n🚀 Presentation server running at http://localhost:${PORT}`);
    console.log(`📱 Remote control available at: ${remoteUrl}\n`);

    console.log('Scan this QR code with your phone to connect:');
    qrcode.generate(remoteUrl, { small: true });
});
