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

            console.log(res.data);

            // ✅ Save token
            localStorage.setItem("token", res.data.token);

            // ✅ Save user
            localStorage.setItem("user", JSON.stringify(res.data.user));

            // 🔥 Role-based redirect
            const role = res.data.user.role;

            if (role === "ADMIN") navigate("/admin");
            else if (role === "DRIVER") navigate("/driver");
            else navigate("/user");

        } catch (err) {
            console.error(err.response?.data || err.message);
            alert("Login Failed ❌");
        }
    };

    return (
        <div className="flex items-center justify-center h-screen">
            <div className="bg-white p-6 rounded shadow w-80">
                <h2 className="text-xl font-bold mb-4 text-center">Login</h2>

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
                    className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
                >
                    Login
                </button>

                {/* 🔥 Step 3 — Navigation to Register */}
                <p className="mt-3 text-sm text-center">
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
    );
};

export default Login;