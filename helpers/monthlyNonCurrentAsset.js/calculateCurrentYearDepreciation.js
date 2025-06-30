function calculateCurrentYearDepreciation(data, date) {
  // Jika data kosong atau tidak valid, return 0
  if (!data || !Array.isArray(data) || data.length === 0) {
    return 0;
  }

  // Parse tanggal yang diberikan atau gunakan tanggal saat ini
  const currentDate = date ? new Date(date) : new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); // 0-based (0 = January)

  // console.log(
  //   `\n=== Calculating Current Year Depreciation for ${currentYear} ===`
  // );
  // console.log(`Current date: ${currentDate.toISOString().split("T")[0]}`);
  // console.log(`Current month: ${currentMonth + 1}`);
  // console.log(`Total assets to process: ${data.length}\n`);

  let totalDepreciation = 0;

  data.forEach((asset, index) => {
    // Ambil data dari dataValues jika ada, atau langsung dari asset
    const assetData = asset.dataValues || asset;

    // console.log(`--- Asset ${index + 1}: ${assetData.name} ---`);
    // console.log(`Asset ID: ${assetData.id}`);
    // console.log(`Asset Type: ${assetData.assetType}`);
    // console.log(`Asset Value: ${assetData.assetValue}`);
    // console.log(`Is Depreciable: ${assetData.isDepreciable}`);
    // console.log(`Depreciation Active: ${assetData.depreciationActive}`);

    // Skip jika aset tidak dapat didepresiasi atau tidak aktif
    if (!assetData.isDepreciable || !assetData.depreciationActive) {
      // console.log(`❌ Skipped: Asset is not depreciable or inactive\n`);
      return;
    }

    const acquisitionDate = new Date(assetData.acquisitionDate);
    const depreciationMonths = parseInt(assetData.depreciationMonths);
    const monthlyDepreciation = parseFloat(assetData.depreciationValue);

    // console.log(
    //   `Acquisition Date: ${acquisitionDate.toISOString().split("T")[0]}`
    // );
    // console.log(`Depreciation Months: ${depreciationMonths}`);
    // console.log(
    //   `Monthly Depreciation: ${monthlyDepreciation.toLocaleString()}`
    // );

    // Hitung tanggal akhir depresiasi
    const depreciationEndDate = new Date(acquisitionDate);
    depreciationEndDate.setMonth(
      depreciationEndDate.getMonth() + depreciationMonths
    );

    // console.log(
    //   `Depreciation End Date: ${
    //     depreciationEndDate.toISOString().split("T")[0]
    //   }`
    // );

    // Hitung jumlah bulan depresiasi dalam tahun berjalan
    let monthsInCurrentYear = 0;

    // Hitung bulan mulai dan berakhir depresiasi dalam tahun berjalan
    const acquisitionYear = acquisitionDate.getFullYear();
    const acquisitionMonth = acquisitionDate.getMonth(); // 0-based (0 = January)
    const depreciationEndYear = depreciationEndDate.getFullYear();
    const depreciationEndMonth = depreciationEndDate.getMonth();

    // console.log(`Acquisition: ${acquisitionYear}-${acquisitionMonth + 1}`);
    // console.log(
    //   `Depreciation End: ${depreciationEndYear}-${depreciationEndMonth + 1}`
    // );

    // Tentukan bulan pertama dan terakhir depresiasi dalam tahun berjalan
    let firstMonthInCurrentYear = 0; // January
    let lastMonthInCurrentYear = currentMonth; // Sampai bulan saat ini

    // Jika akuisisi dimulai dalam tahun berjalan
    if (acquisitionYear === currentYear) {
      firstMonthInCurrentYear = acquisitionMonth;
      // console.log(
      //   `Asset acquired in ${currentYear}, starting from month ${
      //     acquisitionMonth + 1
      //   }`
      // );
    } else if (acquisitionYear > currentYear) {
      // Aset dibeli setelah tahun berjalan, tidak ada depresiasi
      // console.log(`❌ Skipped: Asset acquired after ${currentYear}\n`);
      return;
    }

    // Jika depresiasi berakhir dalam tahun berjalan
    if (depreciationEndYear === currentYear) {
      lastMonthInCurrentYear = Math.min(depreciationEndMonth - 1, currentMonth); // Bulan terakhir yang didepresiasi (exclusive end) atau bulan saat ini
      // console.log(
      //   `Depreciation ends in ${currentYear}, last month is ${
      //     lastMonthInCurrentYear + 1
      //   }`
      // );
    } else if (depreciationEndYear < currentYear) {
      // Depresiasi sudah berakhir sebelum tahun berjalan
      // console.log(`❌ Skipped: Depreciation ended before ${currentYear}\n`);
      return;
    }

    // Hitung jumlah bulan dalam tahun berjalan
    if (lastMonthInCurrentYear >= firstMonthInCurrentYear) {
      monthsInCurrentYear =
        lastMonthInCurrentYear - firstMonthInCurrentYear + 1;
    }

    // console.log(
    //   `Months in ${currentYear}: ${firstMonthInCurrentYear + 1} to ${
    //     lastMonthInCurrentYear + 1
    //   } = ${monthsInCurrentYear} months`
    // );

    // Tambahkan depresiasi untuk aset ini
    const assetDepreciation = monthsInCurrentYear * monthlyDepreciation;
    totalDepreciation += assetDepreciation;

    // console.log(
    //   `Asset Depreciation: ${monthsInCurrentYear} × ${monthlyDepreciation.toLocaleString()} = ${assetDepreciation.toLocaleString()}`
    // );
    // console.log(`Running Total: ${totalDepreciation.toLocaleString()}\n`);
  });

  // console.log(`=== FINAL RESULT ===`);
  // console.log(
  //   `Total Current Year Depreciation (${currentYear}): ${totalDepreciation.toLocaleString()}`
  // );
  // console.log(`========================\n`);

  return totalDepreciation;
}

module.exports = { calculateCurrentYearDepreciation };
