const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Initialize state
let teams = [
    { name: "Team 1", coins: 10000 },
    { name: "Team 2", coins: 10000 },
    { name: "Team 3", coins: 10000 },
    { name: "Team 4", coins: 10000 },
    { name: "Team 5", coins: 10000 },
    { name: "Team 6", coins: 10000 }
];
let bidHistory = [];

// Serve static files
app.use(express.static(path.join(__dirname)));

// Serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Handle socket connections
io.on('connection', (socket) => {
    console.log('A user connected');
    // Send current state to new client
    socket.emit('updateState', { teams, bidHistory });

    // Update team name
    socket.on('updateTeamName', ({ index, name }) => {
        teams[index].name = name;
        io.emit('updateState', { teams, bidHistory });
    });

    // Place bid
    socket.on('placeBid', ({ teamIndex, bidAmount, bidItem }) => {
        teams[teamIndex].coins -= bidAmount;
        const bidLog = `${teams[teamIndex].name} bid ${bidAmount} coins for "${bidItem}" at ${new Date().toLocaleTimeString()}`;
        bidHistory.unshift(bidLog);
        io.emit('updateState', { teams, bidHistory });
    });

    // Assign coins
    socket.on('assignCoins', ({ teamIndex, assignAmount }) => {
        teams[teamIndex].coins += assignAmount;
        const assignLog = `${teams[teamIndex].name} received ${assignAmount} coins at ${new Date().toLocaleTimeString()}`;
        bidHistory.unshift(assignLog);
        io.emit('updateState', { teams, bidHistory });
    });

    // Reset auction
    socket.on('resetAuction', () => {
        teams = teams.map(team => ({ ...team, coins: 10000 }));
        bidHistory = [];
        io.emit('updateState', { teams, bidHistory });
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});