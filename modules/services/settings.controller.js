import * as settingsService from "./settings.service.js";

export const getSettings = async (req, res, next) => {
  try {
    const schoolId = req.user.schoolId;
    const settings = await settingsService.getSchoolSettings(schoolId);

    res.status(200).json({
      status: "success",
      data: { settings },
    });
  } catch (error) {
    next(error);
  }
};

export const updateSettings = async (req, res, next) => {
  try {
    const schoolId = req.user.schoolId;
    const updatedSettings = await settingsService.updateSchoolSettings(
      schoolId,
      req.body,
      req.user,
    );

    res.status(200).json({
      status: "success",
      message: "School settings updated successfully.",
      data: { settings: updatedSettings },
    });
  } catch (error) {
    next(error);
  }
};
