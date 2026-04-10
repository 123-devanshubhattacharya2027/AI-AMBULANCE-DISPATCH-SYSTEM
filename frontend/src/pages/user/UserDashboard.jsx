import { useState } from "react";
import API from "../../api/axios";

const UserDashboard = () => {
    const [form, setForm] = useState({
        emergencyType: "",
        description: "",
        latitude: "",
        longitude: "",
    });

    const handleSubmit = async () => {
        if (
            !form.emergencyType ||
            !form.description ||
            !form.latitude ||
            !form.longitude
        ) {
            alert("Please fill all fields ❌");
            return;
        }

        try {
            const res = await API.post("/requests", {
                // 🔥 Convert to uppercase for enum match
                emergencyType: form.emergencyType.toUpperCase(),

                description: form.description,
                location: {
                    type: "Point",
                    coordinates: [
                        Number(form.longitude),
                        Number(form.latitude),
                    ],
                },
            });

            console.log(res.data);
            alert("Request Created 🚑");

            setForm({
                emergencyType: "",
                description: "",
                latitude: "",
                longitude: "",
            });

        } catch (err) {
            console.error(err.response?.data || err.message);
            alert(err.response?.data?.message || "Error creating request ❌");
        }
    };

    return (
        <div className="p-6 max-w-md mx-auto">
            <h2 className="text-xl font-bold mb-4 text-center">
                Emergency Request 🚑
            </h2>

            {/* 🔥 INPUT + DROPDOWN (BEST UX) */}
            <input
                list="emergency-types"
                placeholder="Select or type emergency type"
                className="block w-full mb-2 p-2 border rounded"
                value={form.emergencyType}
                onChange={(e) =>
                    setForm({ ...form, emergencyType: e.target.value })
                }
            />

            <datalist id="emergency-types">
                <option value="ACCIDENT" />
                <option value="HEART ATTACK" />
                <option value="FIRE" />
                <option value="STROKE" />
                <option value="PREGNANCY" />
                <option value="BREATHING PROBLEM" />
                <option value="INJURY" />
                <option value="BURN" />
                <option value="UNCONSCIOUS" />
                <option value="OTHER" />
            </datalist>

            {/* Description */}
            <input
                placeholder="Description"
                className="block w-full mb-2 p-2 border rounded"
                value={form.description}
                onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                }
            />

            {/* Latitude */}
            <input
                placeholder="Latitude"
                className="block w-full mb-2 p-2 border rounded"
                value={form.latitude}
                onChange={(e) =>
                    setForm({ ...form, latitude: e.target.value })
                }
            />

            {/* Longitude */}
            <input
                placeholder="Longitude"
                className="block w-full mb-2 p-2 border rounded"
                value={form.longitude}
                onChange={(e) =>
                    setForm({ ...form, longitude: e.target.value })
                }
            />

            {/* Auto Location */}
            <button
                onClick={() => {
                    navigator.geolocation.getCurrentPosition((pos) => {
                        setForm({
                            ...form,
                            latitude: pos.coords.latitude,
                            longitude: pos.coords.longitude,
                        });
                    });
                }}
                className="bg-blue-500 text-white p-2 mb-2 w-full rounded"
            >
                Use My Location 📍
            </button>

            {/* Submit */}
            <button
                onClick={handleSubmit}
                className="bg-red-500 text-white p-2 w-full rounded hover:bg-red-600"
            >
                Create Request
            </button>
        </div>
    );
};

export default UserDashboard;