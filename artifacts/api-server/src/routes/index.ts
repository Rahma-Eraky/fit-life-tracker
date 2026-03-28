import { Router, type IRouter } from "express";
import healthRouter from "./health";
import workoutsRouter from "./workouts";
import mealsRouter from "./meals";
import blogRouter from "./blog";
import profileRouter from "./profile";
import progressRouter from "./progress";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/workouts", workoutsRouter);
router.use("/meals", mealsRouter);
router.use("/blog", blogRouter);
router.use("/profile", profileRouter);
router.use("/progress", progressRouter);

export default router;
