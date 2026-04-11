import loginBg from "../../assets/login-bg.jpg";
import { useState } from "react";
import API from "../../api/axios";
import { useNavigate } from "react-router-dom";

const Login = () => {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        email: "",
        password: "",
    });

    const handleLogin = async () => {
        try {
            const res = await API.post("/auth/login", form);

            console.log("🔥 LOGIN RESPONSE:", res.data);

            // ✅ FIXED RESPONSE STRUCTURE
            const token = res.data.token;
            const user = res.data.user;

            if (!token || !user) {
                alert("Invalid response from server ❌");
                return;
            }

            // ✅ STORE TOKEN & USER
            localStorage.setItem("token", token);
            localStorage.setItem("user", JSON.stringify(user));

            console.log("✅ Token saved:", token);
            console.log("✅ User saved:", user);

            const role = user.role;

            // ✅ ROLE BASED REDIRECT
            if (role === "ADMIN") navigate("/admin");
            else if (role === "DRIVER") navigate("/driver");
            else navigate("/user");

        } catch (err) {
            console.error("❌ LOGIN ERROR:", err.response?.data || err.message);

            alert(
                err.response?.data?.message || "Login Failed ❌"
            );
        }
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center overflow-hidden">

            {/* 🔥 BACKGROUND IMAGE */}
            <img
                src={loginBg}
                alt="bg"
                className="absolute inset-0 w-full h-full object-cover"
            />

            {/* 🔥 OVERLAY */}
            <div className="absolute inset-0 bg-black/60"></div>

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

                {/* Login Card */}
                <div className="bg-white p-8 rounded-xl shadow-xl w-80">

                    <h2 className="text-2xl font-bold mb-6 text-center">
                        Login
                    </h2>

                    {/* Email */}
                    <input
                        type="email"
                        placeholder="Email"
                        className="w-full mb-3 p-2 border rounded"
                        onChange={(e) =>
                            setForm({ ...form, email: e.target.value })
                        }
                    />

                    {/* Password */}
                    <input
                        type="password"
                        placeholder="Password"
                        className="w-full mb-3 p-2 border rounded"
                        onChange={(e) =>
                            setForm({ ...form, password: e.target.value })
                        }
                    />

                    {/* Button */}
                    <button
                        onClick={handleLogin}
                        className="w-full bg-red-500 text-white p-2 rounded hover:bg-red-600 transition"
                    >
                        Login
                    </button>

                    {/* Redirect */}
                    <p className="text-center mt-3 text-sm">
                        Don't have an account?{" "}
                        <span
                            className="text-blue-500 cursor-pointer"
                            onClick={() => navigate("/register")}
                        >
                            Register
                        </span>
                    </p>

                </div>
            </div>
        </div>
    );
};

export default Login;