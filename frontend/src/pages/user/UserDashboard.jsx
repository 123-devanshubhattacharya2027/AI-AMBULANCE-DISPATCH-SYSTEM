import { useState, useEffect } from "react";
import API from "../../api/axios";
import { Ambulance, MapPin } from "lucide-react";

// 🔥 MAP IMPORTS
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";

// 🔥 SOCKET (for real-time later)
import { io } from "socket.io-client";

const ambulanceIcon = new L.Icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/2967/2967350.png",
    iconSize: [40, 40],
});

const UserDashboard = () => {
    const [form, setForm] = useState({
        emergencyType: "",
        description: "",
        latitude: "",
        longitude: "",
    });

    const [loadingLocation, setLoadingLocation] = useState(false);
    const [locationStatus, setLocationStatus] = useState("");
    const [address, setAddress] = useState("");

    // 🚑 STEP 1: DRIVER STATE
    const [driverPosition, setDriverPosition] = useState([28.61, 77.20]);
    const [route, setRoute] = useState([]);

    // 🚑 CREATE REQUEST
    const handleSubmit = async () => {
        try {
            await API.post("/requests", {
                emergencyType: form.emergencyType,
                description: form.description,
                location: {
                    type: "Point",
                    coordinates: [form.longitude, form.latitude],
                },
            });

            alert("🚑 Request Created Successfully");
        } catch {
            alert("❌ Error creating request");
        }
    };

    // 📍 GET LOCATION + ADDRESS
    const handleGetLocation = async () => {
        if (!navigator.geolocation) {
            setLocationStatus("❌ Geolocation not supported");
            return;
        }

        setLoadingLocation(true);
        setLocationStatus("📍 Fetching location...");

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;

                setForm((prev) => ({
                    ...prev,
                    latitude: lat,
                    longitude: lng,
                }));

                try {
                    const res = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
                    );
                    const data = await res.json();
                    setAddress(data.display_name);
                } catch {
                    setAddress("Address not found");
                }

                setLoadingLocation(false);
                setLocationStatus("✅ Location fetched");
            },
            () => {
                setLoadingLocation(false);
                setLocationStatus("❌ Permission denied");
            }
        );
    };

    // 🚑 STEP 2 — SIMULATED MOVEMENT
    useEffect(() => {
        const interval = setInterval(() => {
            setDriverPosition((prev) => {
                const newPos = [prev[0] + 0.0005, prev[1] + 0.0005];
                setRoute((r) => [...r, newPos]);
                return newPos;
            });
        }, 2000);

        return () => clearInterval(interval);
    }, []);

    // 🚑 STEP 7 — SOCKET READY (REAL TIME)
    useEffect(() => {
        const socket = io("http://localhost:5000");

        socket.on("location_update", (data) => {
            setDriverPosition(data.coordinates);
            setRoute((prev) => [...prev, data.coordinates]);
        });

        return () => socket.disconnect();
    }, []);

    return (
        <div className="min-h-screen relative flex items-center justify-center overflow-hidden">

            {/* BACKGROUND */}
            <img
                src="/ambulance-bg.jpg"
                className="absolute inset-0 w-full h-full object-cover brightness-110"
                alt="bg"
            />

            <div className="absolute inset-0 bg-black/50"></div>

            <div className="relative z-10 bg-black/60 backdrop-blur-xl p-6 rounded-3xl w-[420px] text-white">

                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <Ambulance /> Emergency Request
                </h2>

                {/* FORM */}
                <input
                    placeholder="Emergency Type"
                    className="w-full mb-2 p-2 rounded bg-white/10"
                    onChange={(e) =>
                        setForm({ ...form, emergencyType: e.target.value })
                    }
                />

                <textarea
                    placeholder="Describe situation..."
                    className="w-full mb-2 p-2 rounded bg-white/10"
                    onChange={(e) =>
                        setForm({ ...form, description: e.target.value })
                    }
                />

                {/* LOCATION BUTTON */}
                <button
                    onClick={handleGetLocation}
                    className="w-full bg-blue-500 p-2 rounded mb-2"
                >
                    <MapPin size={16} /> Use My Location
                </button>

                {/* STATUS */}
                <p className="text-sm">{locationStatus}</p>

                {/* ADDRESS */}
                {address && (
                    <p className="text-xs text-gray-300 mt-2">
                        📍 {address}
                    </p>
                )}

                {/* 🗺️ MAP WITH TRACKING */}
                {form.latitude && (
                    <MapContainer
                        center={driverPosition}
                        zoom={13}
                        style={{ height: "250px", marginTop: "10px", borderRadius: "10px" }}
                    >
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                        {/* 🚑 MOVING AMBULANCE */}
                        <Marker position={driverPosition} icon={ambulanceIcon}>
                            <Popup>🚑 Ambulance is coming</Popup>
                        </Marker>

                        {/* 📍 USER */}
                        <Marker position={[form.latitude, form.longitude]}>
                            <Popup>Your Location</Popup>
                        </Marker>

                        {/* 🔥 ROUTE */}
                        <Polyline positions={route} color="red" />
                    </MapContainer>
                )}

                {/* SUBMIT */}
                <button
                    onClick={handleSubmit}
                    className="w-full bg-red-500 mt-3 p-2 rounded"
                >
                    🚑 Send Request
                </button>
            </div>
        </div>
    );
};

export default UserDashboard;