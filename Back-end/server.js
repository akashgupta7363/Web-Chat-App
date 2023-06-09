const express = require("express");
const app = express();
const dotenv = require("dotenv");
const chats = require("./Dummy data/data");
const connectDB = require("./config/db");
const colors = require("colors");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");
const path = require("path");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
app.use(express.json());

dotenv.config();
connectDB();

app.use("/api/user", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);

//-------Deployment-------//
const _dirname1 = path.resolve();
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(_dirname1, "/front-end/build")));
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(_dirname1, "front-end", "build", "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res.send("API IS RUNNING");
  });
}

//-------Deployment-------//

// app.get("/api/chat", (req, res) => {
//   res.send(chats);
// });

// app.get("/api/chat/:id", (req, res) => {
//   const singleChat = chats.find((c) => c._id == req.params.id);
//   res.send(singleChat);
// });
app.use(notFound);
app.use(errorHandler);

PORT = process.env.PORT || 8000;
const server = app.listen(
  PORT,
  console.log(`Server is listenning on port ${PORT}`.yellow.bold)
);
const io = require("socket.io")(server, {
  pingTimeout: 60000,
  cors: {
    origin: "http://localhost:3000",
  },
});
io.on("connection", (socket) => {
  console.log("connected to socket.io");

  socket.on("setup", (userData) => {
    socket.join(userData._id);
    // console.log(userData._id);
    socket.emit("connected");
  });

  socket.on("join chat", (room) => {
    socket.join(room);
    console.log(`User joined Room:` + room);
  });

  socket.on("typing", (room) => socket.in(room).emit("typing"));
  socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

  socket.on("new message", (newMessageRecieved) => {
    var chat = newMessageRecieved.chat;
    if (!chat.users) return console.log("chat.users not defined");
    chat.users.forEach((user) => {
      if (user._id === newMessageRecieved.sender._id) return;

      socket.in(user._id).emit("message recieved", newMessageRecieved);
    });
  });

  socket.off("setup", () => {
    console.log("Userisconnected");
    socket.leave(userData._id);
  });
});
