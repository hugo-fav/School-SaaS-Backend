export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  };
};

export const attachSchoolFilter = (req, res, next) => {
  req.schoolFilter = {
    schoolId: req.user.schoolId,
  };

  next();
};
