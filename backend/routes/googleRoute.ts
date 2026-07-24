import { Router } from "express";

import { GoogleController } from "../controllers/googleController";
import { isJwtAuthTokenExit } from "../middleware/isJwtAutTokenExit";

// import {auth} from "../middleware/middlewares";

class UserRouter {
    public router: Router;
    constructor() {
        this.router = Router();
        this.routes();
    }

    routes() {
        this.router.post('/google', GoogleController.getGoogleLoginPage);


    }
}

export default new UserRouter().router;
