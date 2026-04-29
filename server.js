const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

let players = {};

io.on("connection", (socket) => {
  console.log("Player connected:", socket.id);

  socket.on("updatePlayer", (data) => {
    players[data.id] = data;
    io.emit("players", players);
  });

  socket.on("disconnect", () => {
    console.log("Player disconnected:", socket.id);
    delete players[socket.id];
  });
});

server.listen(3000, () => {
  console.log("Server running on port 3000");
});
