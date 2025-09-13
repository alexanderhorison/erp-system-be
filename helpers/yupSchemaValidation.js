const { throwValidation } = require("./responses");

// Validation will return single error in schema
async function yupSchemaValidation(data, schema) {
  try {
    const response = await schema.validate(data);
    return response;
  } catch (error) {
    throw throwValidation(400, error.message);
  }
}

// Validation will return all error in schema
async function yupSchemaValidationAll(data, schema) {
  try {
    const response = await schema.validate(data, { abortEarly: false });
    return response;
  } catch (error) {
    const validationErrors = error.inner.map((err) => err.message);
    throw throwValidation(400, validationErrors);
  }
}

// Strict mode: will not allow unknown keys that are not defined in schema
async function yupSchemaValidationStrict(data, schema) {
  try {
    return await schema.validate(data, {
      stripUnknown: true,
      abortEarly: false,
    });
  } catch (error) {
    throw throwValidation(400, error.errors.join(", "));
  }
}

module.exports = {
  yupSchemaValidation,
  yupSchemaValidationAll,
  yupSchemaValidationStrict,
};
