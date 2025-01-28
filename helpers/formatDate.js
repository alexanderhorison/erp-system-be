const moment = require("moment");
require("moment/locale/id");

function formatDate(dateString) {
  if (!dateString) {
    return "";
  }

  return moment(dateString).locale("id").format("DD MMMM YYYY");
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

module.exports = {
  formatDate,
  formatDateWithTime,
  formatTime,
  formatDateFromString,
  formatTimeSecond,
};
