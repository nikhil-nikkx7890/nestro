/**
 * validateRequest
 *
 * Generic middleware factory for validating req.body against a Zod schema.
 * Runs before the controller, same layer as validateObjectId.
 *
 * Usage:
 *   router.post("/", validateRequest(createCategorySchema), createCategory);
 */
export const validateRequest = (schema) => (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
        const errors = result.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
        }));

        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors,
        });
    }

    // Replace req.body with the parsed, trimmed, type-coerced data
    req.body = result.data;
    next();
};