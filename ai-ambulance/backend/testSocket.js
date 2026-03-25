const { io } = require("socket.io-client");

const socket = io("http://localhost:5000");

socket.on("connect", () => {
    console.log("✅ Connected to server:", socket.id);
});

// Join admin
socket.emit("join_admin");

// Join driver (replace with real ID)
socket.emit("join_driver", "69c3ebe717ea83be4ef6a3b1");

// Listen events
socket.on("request_assigned", (data) => {
    console.log("📊 Admin received:", data);
});

socket.on("new_assignment", (data) => {
    console.log("🚑 Driver received:", data);
});