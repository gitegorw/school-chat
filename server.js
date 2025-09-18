const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Store connected users
const users = new Map();

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Handle socket connections
io.on('connection', (socket) => {
    console.log('New user connected:', socket.id);

    // Handle user joining
    socket.on('join', (username) => {
        if (!username) return;
        
        users.set(socket.id, username);
        socket.broadcast.emit('user-joined', username);
        
        // Send current users list to the new user
        const usersList = Array.from(users.values());
        socket.emit('users-list', usersList);
        
        console.log(`${username} joined the chat`);
    });

    // Handle chat messages
    socket.on('chat-message', (data) => {
        const username = users.get(socket.id);
        if (username && data.message) {
            const messageData = {
                username: username,
                message: data.message,
                timestamp: new Date().toLocaleTimeString()
            };
            
            // Broadcast message to all users
            io.emit('message', messageData);
            console.log(`${username}: ${data.message}`);
        }
    });

    // Handle typing indicators
    socket.on('typing', () => {
        const username = users.get(socket.id);
        if (username) {
            socket.broadcast.emit('user-typing', username);
        }
    });

    socket.on('stop-typing', () => {
        const username = users.get(socket.id);
        if (username) {
            socket.broadcast.emit('user-stop-typing', username);
        }
    });

    // Handle user disconnect
    socket.on('disconnect', () => {
        const username = users.get(socket.id);
        if (username) {
            users.delete(socket.id);
            socket.broadcast.emit('user-left', username);
            console.log(`${username} left the chat`);
        }
    });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Chat server running on port ${PORT}`);
    console.log(`Access the chat at: http://10.17.49.118:${PORT}`);
});