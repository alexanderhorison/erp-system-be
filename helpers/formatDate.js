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

module.exports = {
  formatDate
}