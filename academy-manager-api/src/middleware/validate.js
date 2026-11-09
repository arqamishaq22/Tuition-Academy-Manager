import { ZodError } from "zod";
import ApiError from "../utils/ApiError.js";

/**
 * Express middleware to validate request data using a Zod schema.
 * Supports schemas that validate { body, query, params } together,
 * or schemas targeting req.body directly.
 *
 * Returns HTTP 422 Unprocessable Entity with field-level error messages if validation fails.
 *
 * @param {import('zod').ZodSchema} schema - Zod validation schema
 * @returns {Function} Express middleware function
 */
export function validate(schema) {
  return async (req, res, next) => {
    try {
      // Check if schema has body, query, or params keys
      const dataToValidate = {
        body: req.body,
        query: req.query,
        params: req.params,
      };

      // If the schema defines any of body/query/params, parse dataToValidate
      // Otherwise, assume the schema validates req.body directly
      const isMultiTargetSchema =
        schema.shape && (schema.shape.body || schema.shape.query || schema.shape.params);

      if (isMultiTargetSchema) {
        const validated = await schema.parseAsync(dataToValidate);
        if (validated.body !== undefined) req.body = validated.body;
        if (validated.query !== undefined) req.query = validated.query;
        if (validated.params !== undefined) req.params = validated.params;
      } else {
        req.body = await schema.parseAsync(req.body);
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Extract clean field-level error list for the client
        const formattedErrors = error.errors.map((err) => ({
          field: err.path.join(".").replace(/^(body|query|params)\./, ""),
          message: err.message,
        }));

        next(new ApiError(422, "Validation failed. Please correct the highlighted errors.", formattedErrors));
      } else {
        next(error);
      }
    }
  };
}

export default validate;
