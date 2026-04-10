import { useEffect, useState } from "react";
import API from "../../api/axios";

const AdminDashboard = () => {
    const [requests, setRequests] = useState([]);

    const fetchRequests = async () => {
        try {
            const res = await API.get("/requests");

            console.log("API RESPONSE:", res.data);

            setRequests(res.data.data?.requests || []);
        } catch (err) {
            console.error(err.response?.data || err.message);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    return (
        <div className="p-6">
            <h2 className="text-xl font-bold mb-4">All Requests 🚑</h2>

            {requests.length === 0 ? (
                <p>No requests found ❌</p>
            ) : (
                requests.map((req) => (
                    <div key={req._id} className="border p-3 mb-2 rounded">
                        <p><b>Type:</b> {req.emergencyType}</p>
                        <p><b>Description:</b> {req.description}</p>
                        <p><b>Status:</b> {req.status}</p>
                    </div>
                ))
            )}
        </div>
    );
};

export default AdminDashboard;