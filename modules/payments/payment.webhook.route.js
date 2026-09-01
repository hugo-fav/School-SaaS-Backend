import express from "express";
import { paystackWebhookController } from "./payment.webhook.controller.js";

const router = express.Router();

router.post("/", paystackWebhookController);

export default router;
