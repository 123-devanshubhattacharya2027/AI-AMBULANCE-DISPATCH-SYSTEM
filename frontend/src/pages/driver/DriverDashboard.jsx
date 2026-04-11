import { useEffect, useState } from "react";
import API from "../../api/axios";

const DriverDashboard = () => {
    const [requests, setRequests] = useState([]);

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

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6">
            <h1 className="text-3xl font-bold mb-6">
                🚑 Driver Dashboard
            </h1>

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