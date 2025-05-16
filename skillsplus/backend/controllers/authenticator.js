import jwt from "jsonwebtoken";


/**
 * Middleware factory for authentication and role-based authorization.
 * @param {string[]} allowedRoles - List of roles allowed to access the route.
 * @param {boolean} [enforceSelf=false] - If true, and if the user is a "User" (employee),
 *                                        then the ID provided in req.query or req.body must match req.user.id.
 */
const authenticate = (allowedRoles, enforceSelf = false) => {
    return (req, res, next) => {
        const authHeader = req.headers["authorization"];
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ error: "Access Denied: No token provided" });
        }
        const token = authHeader.split(" ")[1];
        //console.log(token);
        /* console.log("Connected Users:", global.connected_users);
        console.log("Token to Check:", token);
        console.log("Token Found?", global.connected_users.includes(token)); */
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
           /*  if(global.connected_users.includes(token)) // change to ! after development
            {
                console.log("Token not found in connected_users");
                return res.status(402).json({ error: "Access Denied: you token is not registered in our system"});
            } */
            // If the user is an employee and self-access is enforced, verify they can only access their own data.
            if (req.user.role === "Employee" && enforceSelf) {
                const idToCheck = req.query.id || req.body.id;
                if (idToCheck && idToCheck != req.user.id) {
                    return res.status(410).json({ error: "Access Denied: You can only access your own data" });
                    
                }
            }
            next();
        } catch (err) {
            return res.status(403).json({ error: "Invalid Token", details: err.message });
        }
    };
};

export default authenticate;