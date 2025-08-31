
const justifyLeft = (str, length) => {
  return str + ' '.repeat(length - str.length);  // Rata kiri
}

const justifyRight = (str, length) => {
  return ' '.repeat(length - str.length) + str;  // Rata kanan
}

const addLine = (length) => {
  return '-'.repeat(length);  // Menambahkan garis sesuai panjang yang diinginkan
}

const addSpace = (length) => {
  return ' '.repeat(length);
}

const justifyCenter = (str) => {
  return `\x1b\x61\x01\x1b\x21\x30${str}`
}

const addEnter = (length) => {
  return '\n'.repeat(length);
}

const virtualConsoleLogPos = (buffer) => {
  // Decode buffer jadi UTF-8 biar karakter terbaca benar
  const utf8Buffer = Buffer.from(buffer, 'binary').toString('utf-8');

  // Hapus karakter kontrol ESC/POS secara agresif, kecuali '\n'
  const cleanBuffer = utf8Buffer.replace(/[\x00-\x08\x0B-\x1F\x7F\x1B]/g, '').trim();

  // Fungsi untuk word wrap otomatis sesuai lebar terminal
  const wrapText = (text, width = 48) => {
    const regex = new RegExp(`(.{1,${width}})`, 'g');
    return text.match(regex).join('\n');
  };

  // Fungsi buat perbaiki spasi
  const fixSpacing = (line, width = 48) => {
    return line.padEnd(width, ' ');
  };

  // Split per baris, wrap kalau perlu, perbaiki spasi, dan log
  cleanBuffer.split('\n').forEach((line) => {
    const trimmedLine = line.replace(/\s+$/, ''); // Hapus spasi di akhir aja, bukan di awal
    if (trimmedLine) {  // Cek kalau bukan baris kosong
      const wrapped = wrapText(trimmedLine, 48);
      wrapped.split('\n').forEach(wrappedLine => {
        process.stdout.write(fixSpacing(wrappedLine, 48) + '\n'); // Pakai process.stdout.write
      });
    }
  });
};

const virtualConsoleLogDotMatrix = (buffer) => {
  const utf8Buffer = Buffer.from(buffer, 'binary').toString('utf-8');

  // Hapus karakter kontrol ESC/POS secara agresif, kecuali '\n'
  const cleanBuffer = utf8Buffer.replace(/[\x00-\x08\x0B-\x1F\x7F\x1B]/g, '').trim();

  // Fungsi untuk word wrap otomatis sesuai lebar terminal
  const wrapText = (text, width = 48) => {
    const regex = new RegExp(`(.{1,${width}})`, 'g');
    return text.match(regex).join('\n');
  };

  // Fungsi buat perbaiki spasi
  const fixSpacing = (line, width = 48) => {
    return line.padEnd(width, ' ');
  };

  // Split per baris, wrap kalau perlu, perbaiki spasi, dan log
  cleanBuffer.split('\n').forEach((line) => {
    const trimmedLine = line.replace(/\s+$/, ''); // Hapus spasi di akhir aja, bukan di awal
    if (trimmedLine) {  // Cek kalau bukan baris kosong
      const wrapped = wrapText(trimmedLine, 80);
      wrapped.split('\n').forEach(wrappedLine => {
        process.stdout.write(fixSpacing(wrappedLine, 80) + '\n'); // Pakai process.stdout.write
      });
    }
  });
}


module.exports = {
  justifyLeft,
  justifyRight,
  addLine,
  addSpace,
  justifyCenter,
  addEnter,
  virtualConsoleLogPos,
  virtualConsoleLogDotMatrix,
}
