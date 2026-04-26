import { useState, useEffect, useRef } from "react";
import {
    MapContainer,
    TileLayer,
    Marker,
    useMap,
    useMapEvents,
    Polyline,
} from "react-leaflet";

import { io } from "socket.io-client";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// 🔥 FIX MARKER ICON
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

// 🚑 Ambulance icon
const ambulanceIcon = new L.Icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/2967/2967350.png",
    iconSize: [40, 40],
});

// ==============================
// 🗺️ MAP CONTROLLER
// ==============================
const MapController = ({ position }) => {
    const map = useMap();
    map.flyTo(position, 14);
    return null;
};

// ==============================
// 📍 CLICK HANDLER
// ==============================
const LocationMarker = ({ setPosition, onSelect, resetRoute, reverseGeocode, clearSuggestions }) => {
    useMapEvents({
        click(e) {
            const { lat, lng } = e.latlng;
            setPosition([lat, lng]);
            onSelect(lat, lng);
            resetRoute();
            reverseGeocode(lat, lng);
            clearSuggestions();
        },
    });
    return null;
};

// ==============================
// 🚑 MAIN COMPONENT
// ==============================
const LocationPicker = ({ onSelect, tracking, eta, driverId }) => {

    const [position, setPosition] = useState([28.61, 77.20]);
    const [search, setSearch] = useState("");
    const [suggestions, setSuggestions] = useState([]);

    const [routeCoords, setRouteCoords] = useState([]);
    const [distance, setDistance] = useState(null);
    const [duration, setDuration] = useState(null);

    const [ambulancePos, setAmbulancePos] = useState(null);

    // 🔥 STEP 4 — DRIVER DATA
    const [driver, setDriver] = useState(null);

    const boxRef = useRef();
    const socketRef = useRef(null);

    // ==============================
    // 🔌 SOCKET
    // ==============================
    useEffect(() => {
        if (!tracking) return;

        if (!socketRef.current) {
            socketRef.current = io("http://localhost:5000");
        }

        const socket = socketRef.current;

        socket.on("location_update", (data) => {
            const [lat, lng] = data.coordinates;

            setAmbulancePos([lat, lng]);

            if (position) {
                fetchRoute([lat, lng], position);
            }

            // 🔥 LIVE ETA CHANGE
            setDuration((prev) => {
                if (!prev) return prev;
                return Math.max(prev - 0.3, 1);
            });
        });

        return () => socket.off("location_update");
    }, [tracking, position]);

    // ==============================
    // 🔥 FETCH DRIVER DETAILS
    // ==============================
    useEffect(() => {
        const fetchDriver = async () => {
            if (!driverId) return;

            try {
                const res = await fetch(`http://localhost:5000/api/driver/${driverId}`);
                const data = await res.json();
                setDriver(data.data);
            } catch (err) {
                console.error("Driver fetch error:", err);
            }
        };

        fetchDriver();
    }, [driverId]);

    // ==============================
    // 📞 CALL DRIVER
    // ==============================
    const handleCall = () => {
        if (!driver?.phone) {
            alert("Driver phone not available");
            return;
        }

        window.location.href = `tel:${driver.phone}`;
    };

    // ==============================
    // 🔥 CLICK OUTSIDE
    // ==============================
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (boxRef.current && !boxRef.current.contains(e.target)) {
                setSuggestions([]);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
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

    const reverseGeocode = async (lat, lng) => {
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
            );
            const data = await res.json();

            if (data.display_name) {
                setSearch(data.display_name);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const fetchRoute = async (from, to) => {
        const res = await fetch(
            `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`
        );

        const data = await res.json();
        const route = data.routes[0];

        setRouteCoords(route.geometry.coordinates.map(c => [c[1], c[0]]));
        setDistance((route.distance / 1000).toFixed(2));
        setDuration((route.duration / 60).toFixed(1));
    };

    const handleSelect = (place) => {
        const lat = parseFloat(place.lat);
        const lon = parseFloat(place.lon);

        setPosition([lat, lon]);
        onSelect(lat, lon);
        setSearch(place.display_name);
        setSuggestions([]);

        if (ambulancePos) {
            fetchRoute(ambulancePos, [lat, lon]);
        }
    };

    const handleCurrentLocation = () => {
        navigator.geolocation.getCurrentPosition((pos) => {
            const lat = pos.coords.latitude;
            const lon = pos.coords.longitude;

            setPosition([lat, lon]);
            onSelect(lat, lon);
            reverseGeocode(lat, lon);

            if (ambulancePos) {
                fetchRoute(ambulancePos, [lat, lon]);
            }
        });
    };

    const resetRoute = () => {
        setRouteCoords([]);
        setDistance(null);
        setDuration(null);
    };

    return (
        <div ref={boxRef} className="relative">

            {/* 🚑 DRIVER PANEL */}
            {tracking && (
                <div className="mb-2 bg-white p-3 rounded shadow text-sm">

                    <div className="font-bold text-green-600">
                        🚑 Ambulance Assigned
                    </div>

                    <div>👨‍⚕️ Driver: {driver?.name || "Loading..."}</div>
                    <div>📱 Phone: {driver?.phone || "Loading..."}</div>
                    <div>📍 Status: En Route</div>

                    {eta && <div>⏱️ ETA: {eta} mins</div>}
                    {!eta && duration && <div>⏱️ ETA: {duration} mins</div>}

                    {distance && <div>📏 Distance: {distance} km</div>}

                    {/* 📞 CALL BUTTON */}
                    <button
                        onClick={handleCall}
                        className="mt-2 bg-green-500 text-white px-3 py-1 rounded w-full"
                    >
                        📞 Call Driver
                    </button>
                </div>
            )}

            <input
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search location..."
                className="w-full p-2 border rounded mb-2"
            />

            {suggestions.length > 0 && (
                <div className="absolute bg-white w-full max-h-40 overflow-y-auto z-50 rounded shadow">
                    {suggestions.map((s, i) => (
                        <div
                            key={i}
                            className="p-2 hover:bg-gray-200 cursor-pointer text-sm"
                            onClick={() => handleSelect(s)}
                        >
                            {s.display_name}
                        </div>
                    ))}
                </div>
            )}

            <button
                onClick={handleCurrentLocation}
                className="bg-blue-500 text-white px-3 py-1 rounded mb-2"
            >
                📍 Use My Location
            </button>

            <MapContainer center={position} zoom={13} style={{ height: "400px", width: "100%" }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                <MapController position={position} />

                <Marker position={position} draggable />

                {ambulancePos && (
                    <Marker position={ambulancePos} icon={ambulanceIcon} />
                )}

                <LocationMarker
                    setPosition={setPosition}
                    onSelect={onSelect}
                    resetRoute={resetRoute}
                    reverseGeocode={reverseGeocode}
                    clearSuggestions={() => setSuggestions([])}
                />

                {routeCoords.length > 0 && (
                    <Polyline positions={routeCoords} color="blue" />
                )}
            </MapContainer>
        </div>
    );
};

export default LocationPicker;