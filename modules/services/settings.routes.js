import express from "express";
import * as settingsController from "./settings.controller.js";

import { protect } from "../../middlewares/auth.middleware.js";
import { authorize } from "../../middlewares/authorization.middleware.js";

const router = express.Router();


router.use(protect, authorize("ADMIN"));

router.get("/",  settingsController.getSettings);
router.put("/", settingsController.updateSettings);

export default router;
