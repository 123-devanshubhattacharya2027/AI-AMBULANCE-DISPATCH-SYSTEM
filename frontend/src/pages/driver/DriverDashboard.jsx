import { useEffect, useState } from "react";
import API from "../../api/axios";
import { io } from "socket.io-client";

const DriverDashboard = () => {
    const [requests, setRequests] = useState([]);
    const [tracking, setTracking] = useState(false);

    // ==============================
    // 📦 FETCH ASSIGNED REQUESTS
    // ==============================
    const fetchAssigned = async () => {
        try {
            const res = await API.get("/driver/me/requests");
            setRequests(res.data.data || []);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchAssigned();
    }, []);

    // ==============================
    // 🔌 SOCKET CONNECTION (STEP 4)
    // ==============================
    useEffect(() => {
        const socket = io("http://localhost:5000");

        const user = JSON.parse(localStorage.getItem("user"));

        if (user) {
            socket.emit("join_driver", user._id); // 🔥 join driver room
        }

        // 🚑 RECEIVE NEW REQUEST
        socket.on("new_request", (data) => {
            console.log("🚑 New request received:", data);

            alert("🚑 New Emergency Assigned!");

            // 🔄 refresh requests
            fetchAssigned();
        });

        return () => socket.disconnect();
    }, []);

    // ==============================
    // 🚑 GPS SIMULATION
    // ==============================
    useEffect(() => {
        setTracking(true);

        const interval = setInterval(async () => {
            try {
                const lat = 28.61 + Math.random() * 0.01;
                const lng = 77.20 + Math.random() * 0.01;

                console.log("📍 Sending location:", lat, lng);

                await API.patch("/driver/me/location", {
                    latitude: lat,
                    longitude: lng,
                });

            } catch (err) {
                console.error("Location update error:", err);
            }
        }, 3000);

        return () => {
            clearInterval(interval);
            setTracking(false);
        };
    }, []);

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6">

            <h1 className="text-3xl font-bold mb-2">
                🚑 Driver Dashboard
            </h1>

            {/* 🟢 TRACKING STATUS */}
            <p className="mb-6 text-green-400">
                {tracking
                    ? "🟢 Live Tracking ON (sending location every 3s)"
                    : "🔴 Tracking OFF"}
            </p>

            {requests.length === 0 ? (
                <p>No assigned requests</p>
            ) : (
                requests.map((req) => (
                    <div
                        key={req._id}
                        className="bg-white text-black p-4 rounded mb-3"
                    >
                        <h2 className="font-bold">
                            {req.emergencyType}
                        </h2>
                        <p>{req.description}</p>
                        <p>Status: {req.status}</p>
                    </div>
                ))
            )}
        </div>
    );
};

export default DriverDashboard;