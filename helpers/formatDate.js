const moment = require("moment");
require("moment/locale/id");

function formatDate(dateString) {
  if (!dateString) {
    return "";
  }

  return moment(dateString).locale("id").format("DD MMMM YYYY");
}

function formatDateMonth(dateString) {
  if (!dateString) {
    return "";
  }
  return moment(dateString).locale("id").format("DD-MMM-YY");
}

function formatDateMonthTime(dateString) {
  if (!dateString) {
    return "";
  }
  return moment(dateString).locale("id").format("DD-MMM-YY HH:mm");
}

function formatDateWithTime(dateString) {
  if (!dateString) {
    return "";
  }

  return moment(dateString).locale("id").format("DD MMMM YYYY - HH:mm");
}

function formatTime(dateString) {
  if (!dateString) {
    return "";
  }

  return moment(dateString).locale("id").format("HH:mm");
}

function formatTimeSecond(dateString) {
  if (!dateString) {
    return "";
  }
  return moment(dateString).format("HH:mm:ss");
}

function formatDateWithSlash(dateString) {
  if (!dateString) {
    return "";
  }
  // Create date object and adjust for Indonesia timezone (UTC+7)
  const date = new Date(dateString);
  const indonesiaOffset = 7 * 60; // Indonesia is UTC+7 (7 hours * 60 minutes)
  const utc = date.getTime() + date.getTimezoneOffset() * 60000;
  const indonesiaTime = new Date(utc + indonesiaOffset * 60000);
  return moment(indonesiaTime).format("DD/MM/YYYY HH:mm");
}

function formatDateFromString(dateString) {
  const tempDate = dateString?.split("/");
  const dueDate = `${tempDate[1]}/${tempDate[0]}/${tempDate[2]}`; // MM/DD/YYYY format
  const date = new Date(dueDate); // Create a Date object
  const options = {
    timeZone: "Asia/Jakarta",
  };
  const formattedDate = new Intl.DateTimeFormat("en-US", options).format(date);
  return formattedDate;
}

function formatStartDateDatabase(dateString) {
  const serverOffset = 7 * 60; // Offset dalam menit (7 jam)
  const formattedDateFrom = moment
    .utc(dateString, "YYYY-MM-DD", true) // Format eksplisit
    .utcOffset(serverOffset)
    .startOf("day")
    .format("YYYY-MM-DD HH:mm:ss.SSS Z");
  return new Date(formattedDateFrom).toISOString();
}

function formatEndDateDatabase(dateString) {
  const serverOffset = 7 * 60; // Offset dalam menit (7 jam)
  const formattedDateTo = moment
    .utc(dateString, "YYYY-MM-DD", true) // Format eksplisit
    .utcOffset(serverOffset)
    .endOf("day")
    .format("YYYY-MM-DD HH:mm:ss.SSS Z");
  return new Date(formattedDateTo).toISOString();
}

module.exports = {
  formatDate,
  formatDateWithTime,
  formatTime,
  formatDateFromString,
  formatTimeSecond,
  formatDateWithSlash,
  formatStartDateDatabase,
  formatEndDateDatabase,
  formatDateMonth,
  formatDateMonthTime,
};
