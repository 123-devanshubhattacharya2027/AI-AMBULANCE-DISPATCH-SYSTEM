import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";

const Register = () => {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        name: "",
        email: "",
        password: "",
        role: "USER",
    });

    const handleRegister = async () => {
        try {
            const res = await API.post("/auth/register", form);

            console.log("Register Response:", res.data);

            alert("Registration Successful ✅");

            // redirect to login
            navigate("/login");
        } catch (err) {
            console.error(err.response?.data || err.message);
            alert(err.response?.data?.message || "Registration Failed ❌");
        }
    };

    return (
        <div className="flex items-center justify-center h-screen">
            <div className="bg-white p-6 rounded shadow w-80">
                <h2 className="text-xl font-bold mb-4 text-center">Register</h2>

                {/* Name */}
                <input
                    type="text"
                    placeholder="Name"
                    className="w-full mb-2 p-2 border rounded"
                    onChange={(e) =>
                        setForm({ ...form, name: e.target.value })
                    }
                />

                {/* Email */}
                <input
                    type="email"
                    placeholder="Email"
                    className="w-full mb-2 p-2 border rounded"
                    onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                    }
                />

                {/* Password */}
                <input
                    type="password"
                    placeholder="Password"
                    className="w-full mb-2 p-2 border rounded"
                    onChange={(e) =>
                        setForm({ ...form, password: e.target.value })
                    }
                />

                {/* Role */}
                <select
                    className="w-full mb-3 p-2 border rounded"
                    onChange={(e) =>
                        setForm({ ...form, role: e.target.value })
                    }
                >
                    <option value="USER">User</option>
                    <option value="DRIVER">Driver</option>
                    <option value="ADMIN">Admin</option>
                </select>

                {/* Register Button */}
                <button
                    onClick={handleRegister}
                    className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600"
                >
                    Register
                </button>

                {/* 🔥 Step 3 — Navigation to Login */}
                <p className="mt-3 text-sm text-center">
                    Already have an account?{" "}
                    <span
                        className="text-blue-500 cursor-pointer font-medium"
                        onClick={() => navigate("/login")}
                    >
                        Login
                    </span>
                </p>
            </div>
        </div>
    );
};

export default Register;