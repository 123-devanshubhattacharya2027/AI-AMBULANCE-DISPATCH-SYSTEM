import { useEffect, useState } from "react";
import API from "../../api/axios";
import { Ambulance } from "lucide-react";

const AdminDashboard = () => {
    const [requests, setRequests] = useState([]);

    const fetchRequests = async () => {
        try {
            const token = localStorage.getItem("token");

            console.log("🔥 TOKEN:", token);

            const res = await API.get("/requests", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            console.log("🔥 API RESPONSE:", res.data);

            setRequests(res.data?.data?.requests || []);

        } catch (err) {
            console.error("❌ ERROR:", err.response?.data || err.message);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-black p-6 text-white">

            {/* HEADER */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <Ambulance className="text-red-500" size={36} />
                    <h1 className="text-4xl font-bold tracking-wide">
                        Admin Control Center
                    </h1>
                </div>

                <button
                    onClick={fetchRequests}
                    className="bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-lg shadow-lg transition duration-300"
                >
                    Refresh 🔄
                </button>
            </div>

            {/* GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {requests.length === 0 ? (
                    <p className="text-gray-300 text-lg">
                        No requests found 🚫
                    </p>
                ) : (
                    requests.map((req) => (
                        <div
                            key={req._id}
                            className="backdrop-blur-lg bg-white/10 border border-white/20 p-5 rounded-2xl shadow-xl hover:scale-105 transition duration-300"
                        >

                            <h3 className="text-xl font-bold text-white mb-2">
                                {req.emergencyType}
                            </h3>

                            <p className="text-gray-300 mb-3">
                                {req.description}
                            </p>

                            <span
                                className={`text-xs px-3 py-1 rounded-full ${req.status === "PENDING"
                                        ? "bg-yellow-400/20 text-yellow-300"
                                        : req.status === "DISPATCHED"
                                            ? "bg-blue-400/20 text-blue-300"
                                            : "bg-green-400/20 text-green-300"
                                    }`}
                            >
                                {req.status}
                            </span>

                            {req.assignedDriver && (
                                <p className="mt-3 text-sm text-gray-400">
                                    🚑 Driver:{" "}
                                    <span className="text-white font-medium">
                                        {req.assignedDriver.user?.name}
                                    </span>
                                </p>
                            )}

                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;