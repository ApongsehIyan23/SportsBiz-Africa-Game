const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files reliably using an absolute path
app.use(express.static(path.join(__dirname, 'public')));

// Explicit root route pointing to index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

io.on('connection', (socket) => {
    console.log(`New client connected: ${socket.id}`);

    // Listen for a player choosing a team
    socket.on('joinTeam', (teamName) => {
        socket.join(teamName);
        console.log(`Socket ${socket.id} joined ${teamName}`);
        
        // Send a confirmation back to the client for debugging
        socket.emit('joined', { team: teamName });
    });

    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Open http://localhost:${PORT} on your machine or http://10.41.139.128:${PORT} on test phones.`);
});