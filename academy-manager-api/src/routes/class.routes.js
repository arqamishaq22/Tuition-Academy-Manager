import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { roleGuard } from "../middleware/roleGuard.js";
import { validate } from "../middleware/validate.js";
import { createClassSchema, updateClassSchema } from "../validators/class.validator.js";
import classController from "../controllers/class.controller.js";

const router = Router();

router.use(authenticate);

router.get("/", classController.getAllClasses);
router.get("/:id", classController.getClassById);
router.post(
  "/",
  roleGuard("admin", "owner"),
  validate(createClassSchema),
  classController.createClass
);
router.put(
  "/:id",
  roleGuard("admin", "owner"),
  validate(updateClassSchema),
  classController.updateClass
);
router.delete("/:id", roleGuard("admin", "owner"), classController.deleteClass);

export default router;

