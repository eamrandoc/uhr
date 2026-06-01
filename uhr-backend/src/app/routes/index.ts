import { Router } from "express";
import { AuthRoutes } from "../modules/auth/auth.route";
import { UserRoutes } from "../modules/user/user.route";

export const router = Router();

type TModuleRoute = {
  path: string;
  route: Router;
};

const moduleRoutes: TModuleRoute[] = [
  { path: "/auth", route: AuthRoutes },
  { path: "/users", route: UserRoutes },
];

moduleRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

export default router;