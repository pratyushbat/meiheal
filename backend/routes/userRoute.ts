import { Router } from "express";
import { UserController } from "../controllers/userController";
import { isJwtAuthTokenExit } from "../middleware/isJwtAutTokenExit";
// import {UserController} from "../controller/user-controller";
// import {auth} from "../middleware/middlewares";

class UserRouter {
    public router: Router;
    constructor() {
        this.router = Router();
        this.routes();
    }

    routes() {
        this.router.post('/signup', UserController.signUp);
        this.router.post('/login', UserController.login);
        this.router.get("/getloggeduser", isJwtAuthTokenExit, UserController.getLoggedInUser);
        this.router.post("/logOut", isJwtAuthTokenExit, UserController.logOutUser);
        this.router.post("/setPassword", UserController.verifyguesttokenfromemail);
        this.router.post("/forgetPwd", UserController.sendResetPasswordMail);
        this.router.post("/resetPassword", UserController.setPasswordWithToken);
        this.router.post("/veriyUserMail", UserController.verifyUserMail);
        this.router.post("/verifyUser", UserController.verifyUser);
        this.router.post("/resetPdPP", UserController.setPasswordWithTokenPostPayment);

    }
}

export default new UserRouter().router;
