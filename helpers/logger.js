/**
 * Define All transaction object with logger
 */

function auditTrailLog(
  action,
  action_by,
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
    action_by,
    status,
    request,
    error,
  };
}

module.exports = {
  auditTrailLog,
};
