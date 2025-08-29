const numberToText = (angka) => {
  // Handle angka 0
  if (angka === 0) {
    return "nol rupiah";
  }

  if (angka < 0) {
    angka = Math.abs(angka); // Ubah ke positif untuk proses konversi
  }

  const satuan = [
    "",
    "satu",
    "dua",
    "tiga",
    "empat",
    "lima",
    "enam",
    "tujuh",
    "delapan",
    "sembilan",
  ];

  function konversi(n) {
    let str = "";
    if (n === 0) return "";
    if (n < 10) {
      str = satuan[n];
    } else if (n < 20) {
      str = satuan[n - 10] + " belas";
    } else if (n < 100) {
      str = satuan[Math.floor(n / 10)] + " puluh " + satuan[n % 10];
    } else if (n < 200) {
      str = "seratus " + konversi(n - 100);
    } else if (n < 1000) {
      str = satuan[Math.floor(n / 100)] + " ratus " + konversi(n % 100);
    }
    return str.trim();
  }

  const kelompok = [
    { div: 1000000000, label: "miliar" },
    { div: 1000000, label: "juta" },
    { div: 1000, label: "ribu" },
    { div: 1, label: "" },
  ];

  let hasil = "";
  for (const { div, label } of kelompok) {
    const jumlah = Math.floor(angka / div);
    if (jumlah > 0) {
      hasil += konversi(jumlah) + (label ? " " + label + " " : " ");
      angka = angka % div;
    }
  }

  let finalResult = hasil.trim().replace(/\s+/g, " ") + " rupiah";

  return finalResult;
};

module.exports = { numberToText };
