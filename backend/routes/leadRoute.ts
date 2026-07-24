import { Router } from "express";

import { allLeadsList,createLead,leadcById } from "../controllers/leadController";

const route: Router = Router();


route.post("/createLead",   createLead);

export default route;
