import { Router } from "express";
import { allDietPlansList, createDietPlan, dietPlanById } from "../controllers/dietPlansController";


const route: Router = Router();

route.get("/all", allDietPlansList);
route.get("/dietplanId/:id", dietPlanById);

route.post("/create", createDietPlan);

export default route;
