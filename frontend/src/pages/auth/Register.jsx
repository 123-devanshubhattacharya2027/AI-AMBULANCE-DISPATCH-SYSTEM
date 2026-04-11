import registerBg from "../../assets/register-bg.jpg";
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
            await API.post("/auth/register", form);
            alert("Registered Successfully ✅");
            navigate("/login");
        } catch (err) {
            alert("Registration Failed ❌");
        }
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center overflow-hidden">

            {/* 🔥 BACKGROUND IMAGE */}
            <img
                src={registerBg}
                alt="bg"
                className="absolute inset-0 w-full h-full object-cover"
            />

            {/* 🔥 OVERLAY */}
            <div className="absolute inset-0 bg-black/50"></div>

            {/* 🔥 CONTENT */}
            <div className="relative z-10 flex flex-col items-center">

                {/* Branding */}
                <div className="text-white text-center mb-6">
                    <h1 className="text-4xl font-bold">LifeLine 🚑</h1>
                    <p className="mt-2 text-lg">Emergency Care Network</p>
                    <p className="text-sm opacity-80">
                        Always There in Time
                    </p>
                </div>

                {/* Register Card */}
                <div className="bg-white p-8 rounded-xl shadow-xl w-80">

                    <h2 className="text-2xl font-bold mb-6 text-center">
                        Register
                    </h2>

                    {/* Name */}
                    <input
                        placeholder="Name"
                        className="w-full mb-2 p-2 border rounded"
                        onChange={(e) =>
                            setForm({ ...form, name: e.target.value })
                        }
                    />

                    {/* Email */}
                    <input
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

                    {/* Button */}
                    <button
                        onClick={handleRegister}
                        className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600"
                    >
                        Register
                    </button>

                    {/* Redirect */}
                    <p className="text-center mt-3 text-sm">
                        Already have an account?{" "}
                        <span
                            className="text-blue-500 cursor-pointer"
                            onClick={() => navigate("/login")}
                        >
                            Login
                        </span>
                    </p>

                </div>
            </div>
        </div>
    );
};

export default Register;