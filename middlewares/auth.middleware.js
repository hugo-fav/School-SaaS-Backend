import jwt from "jsonwebtoken";

export const protect = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log("Decoded:", decoded);

    req.user = decoded; // { id, schoolId, role }

    next();
  } catch (err) {
    console.log("JWT ERROR:", err.message);

    return res
      .status(401)
      .json({ message: "Invalid token", error: err.message });
  }
};
