function formatDate(dateString) {
  if (!dateString) {
    return ''
  }

  const date = new Date(dateString);

  const options = {
    weekday: 'long', // Nama hari dalam bahasa Inggris, misalnya: "Senin"
    day: 'numeric', // Tanggal dalam angka, misalnya: 22
    month: 'long', // Nama bulan dalam bahasa Inggris, misalnya: "April"
    year: 'numeric', // Tahun dalam angka, misalnya: 2024
  };

  const dateFormatter = new Intl.DateTimeFormat('id-ID', options);
  const formattedDate = dateFormatter.format(date);

  return formattedDate;
}

function formatDateWithTime(dateString) {
  if (!dateString) {
    return ''
  }

  const date = new Date(dateString);

  const options = {
    weekday: 'long', // Nama hari dalam bahasa Inggris, misalnya: "Senin"
    day: 'numeric', // Tanggal dalam angka, misalnya: 22
    month: 'long', // Nama bulan dalam bahasa Inggris, misalnya: "April"
    year: 'numeric', // Tahun dalam angka, misalnya: 2024
    hour: 'numeric',
    minute: 'numeric'
  };

  const dateFormatter = new Intl.DateTimeFormat('id-ID', options);
  const formattedDate = dateFormatter.format(date);

  const formattedDateParts = formattedDate.split(' ');
  const timePart = formattedDateParts.pop();
  const datePart = formattedDateParts.join(' ');
  const formattedTime = timePart.replace(':', '.');

  return `${datePart} - ${formattedTime}`;
}

module.exports = {
  formatDate,
  formatDateWithTime
}