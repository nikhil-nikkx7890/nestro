import { z } from "zod";

// Only isActive — deliberately not role. See user.controller.js for why
// role changes are Super Admin territory and stay deferred.
export const updateUserStatusSchema = z
  .object({
    isActive: z.boolean({ message: "isActive must be true or false." }),
  })
  .strict();
