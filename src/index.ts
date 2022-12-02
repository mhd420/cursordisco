import { Server } from "socket.io";

interface Player {
  userId: number;
  name: string;
  pos: [number, number];
}

interface ClientToServer {
  join: (userId: number, name: string) => void;
  pos: (pos: [number, number]) => void;
}

interface ServerToClient {
  joined: (userId: number, name: string) => void;
  left: (userId: number, name: string) => void;
  update: (userId: number, pos: [number, number]) => void;
}

const io = new Server<ClientToServer, ServerToClient>();

const players = new Map<string, Player>();

io.on("connection", (socket) => {
  socket.on("join", (userId, name) => {
    players.set(socket.id, { userId, name, pos: [0, 0] });

    players.forEach((player) => {
      if (player.userId == userId) return;
      socket.emit("joined", player.userId, player.name);
    })
    socket.broadcast.emit("joined", userId, name);
  });

  socket.on("pos", (pos) => {
    const data = players.get(socket.id);
    if (!data) return;

    socket.broadcast.emit("update", data.userId, pos);
  })

  socket.on("disconnect", () => {
    const data = players.get(socket.id);
    if (!data) return;

    players.delete(socket.id);
    socket.broadcast.emit("left", data.userId, data.name);
  })
});

io.listen(3000);
