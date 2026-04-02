
export const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {

        // 🔥 DEBUG (VERY IMPORTANT)
        console.log("USER DATA:", req.user);
        console.log("USER ROLE:", req.user?.role);
        console.log("ALLOWED ROLES:", allowedRoles);

        if (!req.user || !req.user.role) {
            return res.status(401).json({
                success: false,
                message: "User role not found"
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: "Forbidden: You are not allowed to access this route"
            });
        }

        next();
    };
};

