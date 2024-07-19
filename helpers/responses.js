function responses(success, message, data = "") {
  const response = {
    success: success,
    message: message,
  };
  if (data) {
    response.data = data;
  }
  return response;
}

function throwValidation(code, message = "failed") {
  throw {
    code: code,
    message: message,
  };
}

module.exports = {
  responses,
  throwValidation,
};
