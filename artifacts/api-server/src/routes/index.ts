import { Router, type IRouter } from "express";
import aiRouter from "./ai";
import healthRouter from "./health";
import syncRouter from "./sync";
import connectionsRouter from "./connections";

const router: IRouter = Router();

router.use(healthRouter);
router.use(aiRouter);
router.use(syncRouter);
router.use(connectionsRouter);

export default router;
