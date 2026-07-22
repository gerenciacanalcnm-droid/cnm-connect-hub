import { z } from "zod";

export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  avatarUrl: z.string().url().optional(),
  companyId: z.string(),
  roles: z.array(z.string()),
  permissions: z.array(z.string()),
  status: z.string(),
  createdAt: z.string(),
});

export type UserDTO = z.infer<typeof userSchema>;
