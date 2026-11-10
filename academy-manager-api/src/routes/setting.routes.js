import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { roleGuard } from "../middleware/roleGuard.js";
import { validate } from "../middleware/validate.js";
import { uploadLogo } from "../middleware/upload.js";
import settingController from "../controllers/setting.controller.js";
import {
  profileUpdateRouteSchema,
  feeSettingsRouteSchema,
  notificationSettingsRouteSchema,
  teamInviteRouteSchema,
  teamUpdateRouteSchema,
  teamDeleteRouteSchema,
} from "../validators/setting.validator.js";

const router = Router();

// Protect all settings routes: authenticated users only
router.use(authenticate);

// 1. READ ENDPOINTS (owner and staff)
router.get("/", roleGuard("owner", "staff"), settingController.getSettings);
router.get("/plan", roleGuard("owner", "staff"), settingController.getPlan);
router.get("/team", roleGuard("owner", "staff"), settingController.getTeam);

// 2. MUTATION ENDPOINTS (strictly owner only)
router.put(
  "/profile",
  roleGuard("owner"),
  validate(profileUpdateRouteSchema),
  settingController.updateProfile
);

router.post(
  "/logo",
  roleGuard("owner"),
  uploadLogo.single("logo"),
  settingController.uploadLogo
);

router.put(
  "/fees",
  roleGuard("owner"),
  validate(feeSettingsRouteSchema),
  settingController.updateFeeSettings
);

router.put(
  "/notifications",
  roleGuard("owner"),
  validate(notificationSettingsRouteSchema),
  settingController.updateNotificationSettings
);

router.post(
  "/team/invite",
  roleGuard("owner"),
  validate(teamInviteRouteSchema),
  settingController.inviteTeamMember
);

router.patch(
  "/team/:userId",
  roleGuard("owner"),
  validate(teamUpdateRouteSchema),
  settingController.updateTeamMember
);

router.delete(
  "/team/:userId",
  roleGuard("owner"),
  validate(teamDeleteRouteSchema),
  settingController.deleteTeamMember
);

export default router;
