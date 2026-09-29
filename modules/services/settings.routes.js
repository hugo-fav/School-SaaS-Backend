import express from "express";
import * as settingsController from "./settings.controller.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorizeRoles } from "../middlewares/authorizeRoles.js"; // Adjust path to your auth middlewares

const router = express.Router();

// Both routes require the user to be logged in and be an ADMIN
router.use(authenticate, authorizeRoles("ADMIN"));

router.get("/", settingsController.getSettings);
router.put("/", settingsController.updateSettings);

export default router;