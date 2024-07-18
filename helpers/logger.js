/**
 * Define All transaction object with logger
 */

function auditTrailLog(
  action,
  actionBy,
  status,
  request = null,
  error = null
) {
  /**
   * Status : success or failed or info
   */
  return {
    date: new Date(),
    action,
    actionBy,
    status,
    request,
    error,
  };
}

module.exports = {
  auditTrailLog,
};
