import type { User } from "@/types/user";
import { usersMock } from "./mocks/users.mock";

const DATA: User[] = usersMock.list();

export interface UserService {
  list(): Promise<User[]>;
  current(): Promise<User>;
}

export const userService: UserService = {
  async list() {
    return DATA;
  },
  async current() {
    return DATA[0]!;
  },
};
