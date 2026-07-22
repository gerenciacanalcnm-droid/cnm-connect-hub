import type { User } from "@/types/user";

export const UserMapper = {
  fromDTO(dto: unknown): User {
    return dto as User;
  },
  toDTO(model: User): unknown {
    return model;
  },
};
