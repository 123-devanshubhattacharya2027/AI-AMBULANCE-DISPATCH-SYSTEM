import { useState, useRef, useEffect } from "react";
import API from "../../api/axios";
import { Ambulance, MapPin } from "lucide-react";
import Select from "react-select";
import LocationPicker from "../../components/LocationPicker";
import { io } from "socket.io-client";

const UserDashboard = () => {

    const emergencyGroups = [
        {
            label: "🩺 Medical",
            options: ["Heart Attack", "Stroke", "Seizure"]
                .map(v => ({ label: v, value: v })),
        },
        {
            label: "🩹 Trauma",
            options: ["Fracture", "Head Injury"]
                .map(v => ({ label: v, value: v })),
        },
        {
            label: "🚗 Accidents",
            options: ["Traffic Accident", "Fall from Height"]
                .map(v => ({ label: v, value: v })),
        },
    ];

    const formatEmergency = (text) =>
        text.toLowerCase().split(" ").map(w => w[0].toUpperCase() + w.slice(1)).join(" ");

    const [form, setForm] = useState({
        emergencyType: "",
        description: "",
        latitude: null,
        longitude: null,
        eta: null,
        driverId: null,
        requestId: null,
    });

    const [search, setSearch] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [locationStatus, setLocationStatus] = useState("");
    const [showMap, setShowMap] = useState(false);
    const [trackingActive, setTrackingActive] = useState(false);

    const boxRef = useRef();

    // ==============================
    // 🔌 SOCKET
    // ==============================
    useEffect(() => {
        const socket = io("http://localhost:5000");

        const user = JSON.parse(localStorage.getItem("user"));
        if (user) socket.emit("join_user", user._id);

        socket.on("driver_assigned", (data) => {
            setLocationStatus("🚑 Ambulance assigned! Tracking started...");
            setTrackingActive(true);
            setShowMap(true);

            setForm((prev) => ({
                ...prev,
                eta: data.eta,
                driverId: data.driverId,
                requestId: data.requestId,
            }));
        });

        return () => socket.disconnect();
    }, []);

    // ==============================
    // 🔍 SEARCH
    // ==============================
    const handleSearch = async (value) => {
        setSearch(value);

        if (!value || value.length < 3) {
            setSuggestions([]);
            return;
        }

        const res = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${value}`
        );
        const data = await res.json();
        setSuggestions(data);
    };

    const handleSelectLocation = (place) => {
        setForm(prev => ({
            ...prev,
            latitude: parseFloat(place.lat),
            longitude: parseFloat(place.lon),
        }));

        setSearch(place.display_name);
        setSuggestions([]);
        setLocationStatus("✅ Location selected");
    };

    // ==============================
    // 🚑 SUBMIT
    // ==============================
    const handleSubmit = async () => {
        if (!form.latitude || !form.longitude) {
            alert("📍 Please select location");
            return;
        }

        if (!form.emergencyType) {
            alert("⚠️ Select emergency type");
            return;
        }

        const res = await API.post("/requests", {
            emergencyType: formatEmergency(form.emergencyType),
            description: form.description,
            location: {
                type: "Point",
                coordinates: [form.longitude, form.latitude],
            },
        });

        setForm(prev => ({
            ...prev,
            requestId: res.data.data._id,
        }));

        alert("🚑 Request Created Successfully");
    };

    // ==============================
    // ❌ CANCEL
    // ==============================
    const handleCancel = async () => {
        if (!form.requestId) return;

        await API.patch(`/requests/${form.requestId}/cancel`);

        setTrackingActive(false);

        setForm(prev => ({
            ...prev,
            eta: null,
            driverId: null,
            requestId: null,
        }));
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative">

            <img src="/ambulance-bg.jpg" className="fixed inset-0 w-full h-full object-cover -z-10" />

            <div className="fixed inset-0 bg-black/60 -z-10"></div>

            <div className="bg-black/50 p-6 rounded-3xl w-[420px] text-white">

                <h2 className="text-2xl font-bold mb-4 flex gap-2">
                    <Ambulance /> Emergency Request
                </h2>

                {/* 🔥 DARK DROPDOWN */}
                <Select
                    options={emergencyGroups}
                    placeholder="Select emergency"
                    className="mt-2"
                    onChange={(s) =>
                        setForm({ ...form, emergencyType: s.value })
                    }
                    styles={{
                        control: (base) => ({
                            ...base,
                            backgroundColor: "#1f2937",
                            borderColor: "#374151",
                            color: "white",
                        }),
                        menu: (base) => ({
                            ...base,
                            backgroundColor: "#1f2937",
                            color: "white",
                        }),
                        option: (base, state) => ({
                            ...base,
                            backgroundColor: state.isFocused ? "#374151" : "#1f2937",
                            color: "white",
                        }),
                        singleValue: (base) => ({
                            ...base,
                            color: "white",
                        }),
                        input: (base) => ({
                            ...base,
                            color: "white",
                        }),
                        placeholder: (base) => ({
                            ...base,
                            color: "#9ca3af",
                        }),
                    }}
                />

                {/* ✅ SHOW SELECTED */}
                {form.emergencyType && (
                    <p className="mt-2 text-green-400 text-sm">
                        Selected: {form.emergencyType}
                    </p>
                )}

                <textarea
                    className="w-full mt-3 p-2 bg-white/10 rounded"
                    placeholder="Describe..."
                    onChange={(e) =>
                        setForm({ ...form, description: e.target.value })
                    }
                />

                <div ref={boxRef} className="relative mt-3">
                    <input
                        className="w-full p-2 bg-white/10 rounded"
                        placeholder="Search location..."
                        value={search}
                        onChange={(e) => handleSearch(e.target.value)}
                    />

                    {suggestions.length > 0 && (
                        <div className="absolute bg-white text-black w-full max-h-40 overflow-y-auto rounded shadow z-50">
                            {suggestions.map((p, i) => (
                                <div key={i} className="p-2 hover:bg-gray-200 cursor-pointer"
                                    onClick={() => handleSelectLocation(p)}>
                                    {p.display_name}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <button onClick={() => setShowMap(true)} className="w-full bg-blue-500 mt-3 p-2 rounded">
                    <MapPin size={16} /> Select on Map
                </button>

                <button onClick={handleSubmit} className="w-full bg-red-500 mt-3 p-2 rounded">
                    🚑 Send Request
                </button>

                {trackingActive && (
                    <button onClick={handleCancel} className="w-full bg-gray-700 mt-2 p-2 rounded">
                        ❌ Cancel Request
                    </button>
                )}
            </div>
        </div>
    );
};

export default UserDashboard;