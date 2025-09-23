function responses(success, message, data = "", pagination = null, meta = null) {
  const response = {
    success: success,
    message: message,
  };
  if (data) {
    response.data = data;
  }
  if (pagination) {
    response.pagination = pagination;
  }
  if (meta) {
    response.meta = meta;
  }
  return response;
}

function throwValidation(code = 500, message = "failed") {
  throw {
    code: code,
    message: message,
  };
}

module.exports = {
  responses,
  throwValidation,
};
