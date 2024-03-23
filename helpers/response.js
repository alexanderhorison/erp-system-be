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

module.exports = {
  responses,
}
