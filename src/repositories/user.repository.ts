import { userService, type UserService } from "@/services/user.service";
export const userRepository: UserService = {
  list: () => userService.list(),
  current: () => userService.current(),
};
