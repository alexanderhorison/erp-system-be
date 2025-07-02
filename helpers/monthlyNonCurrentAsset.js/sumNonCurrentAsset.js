function sumNonCurrentAsset({data, date}) {
  // Jika data kosong atau tidak valid, return 0
  if (!data || !Array.isArray(data) || data.length === 0) {
    return 0;
  }

  // Jika date tidak diberikan, return 0
  if (!date) {
    return 0;
  }

  const inputDate = new Date(date);

  // Hitung total nilai aset berdasarkan kondisi isDepreciable dan waktu depresiasi
  const totalValue = data.reduce((sum, asset) => {
    const acquisitionDate = new Date(asset.acquisitionDate);

    // Hitung selisih bulan antara inputDate dan acquisitionDate
    const yearDiff = inputDate.getFullYear() - acquisitionDate.getFullYear();
    const monthDiff = inputDate.getMonth() - acquisitionDate.getMonth();

    // Hitung total bulan (inclusive) dari bulan akuisisi sampai bulan input
    const totalMonthsPassed = yearDiff * 12 + monthDiff + 1;

    let assetValue;

    if (asset.isDepreciable && asset.depreciationActive) {
      // Jika aset dapat didepresiasi dan aktif
      const depreciationMonths = parseInt(asset.depreciationMonths);
      const depreciationValue = parseFloat(asset.depreciationValue);
      const originalAssetValue = parseFloat(asset.assetValue);

      // Batasi bulan depresiasi sesuai depreciationMonths
      const effectiveMonths = Math.min(
        Math.max(totalMonthsPassed, 0),
        depreciationMonths
      );

      // Hitung total depresiasi yang sudah terjadi
      const totalDepreciation = depreciationValue * effectiveMonths;

      // Nilai aset saat ini = nilai awal - total depresiasi
      assetValue = originalAssetValue - totalDepreciation;

      // Pastikan nilai aset tidak negatif
      assetValue = Math.max(assetValue, 0);
    } else {
      // Jika aset tidak dapat didepresiasi, gunakan assetValue penuh
      assetValue = parseFloat(asset.assetValue);
    }

    // Pastikan assetValue adalah angka yang valid
    return sum + (isNaN(assetValue) ? 0 : assetValue);
  }, 0);

  return totalValue;
}

module.exports = { sumNonCurrentAsset };
