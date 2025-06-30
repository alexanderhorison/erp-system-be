function calculateLastYearDepreciation(data, date) {
  // Jika data kosong atau tidak valid, return 0
  if (!data || !Array.isArray(data) || data.length === 0) {
    return 0;
  }

  // Parse tanggal yang diberikan atau gunakan tanggal saat ini
  const currentDate = date ? new Date(date) : new Date();
  const lastYear = currentDate.getFullYear() - 1;

  // console.log(`\n=== Calculating Last Year Depreciation for ${lastYear} ===`);
  // console.log(`Current date: ${currentDate.toISOString().split("T")[0]}`);
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

    // Hitung periode depresiasi untuk tahun lalu
    const lastYearStart = new Date(lastYear, 0, 1); // 1 Januari tahun lalu
    const lastYearEnd = new Date(lastYear, 11, 31); // 31 Desember tahun lalu

    // console.log(
    //   `Last Year Period: ${lastYearStart.toISOString().split("T")[0]} to ${
    //     lastYearEnd.toISOString().split("T")[0]
    //   }`
    // );

    // Tentukan periode aktual depresiasi dalam tahun lalu
    const depreciationStart =
      acquisitionDate > lastYearStart ? acquisitionDate : lastYearStart;
    const depreciationEnd =
      depreciationEndDate < lastYearEnd ? depreciationEndDate : lastYearEnd;

    // console.log(
    //   `Actual Depreciation Period in ${lastYear}: ${
    //     depreciationStart.toISOString().split("T")[0]
    //   } to ${depreciationEnd.toISOString().split("T")[0]}`
    // );

    // Jika periode depresiasi tidak overlap dengan tahun lalu, skip
    if (depreciationStart > lastYearEnd || depreciationEnd < lastYearStart) {
      // console.log(`❌ Skipped: No overlap with ${lastYear}\n`);
      return;
    }

    // Hitung jumlah bulan depresiasi dalam tahun lalu
    let monthsInLastYear = 0;

    // Hitung bulan mulai dan berakhir depresiasi dalam tahun lalu
    const acquisitionYear = acquisitionDate.getFullYear();
    const acquisitionMonth = acquisitionDate.getMonth(); // 0-based (0 = January)
    const depreciationEndYear = depreciationEndDate.getFullYear();
    const depreciationEndMonth = depreciationEndDate.getMonth();

    // console.log(`Acquisition: ${acquisitionYear}-${acquisitionMonth + 1}`);
    // console.log(
    //   `Depreciation End: ${depreciationEndYear}-${depreciationEndMonth + 1}`
    // );

    // Tentukan bulan pertama dan terakhir depresiasi dalam tahun lalu
    let firstMonthInLastYear = 0; // January
    let lastMonthInLastYear = 11; // December

    // Jika akuisisi dimulai dalam tahun lalu
    if (acquisitionYear === lastYear) {
      firstMonthInLastYear = acquisitionMonth;
      // console.log(
      //   `Asset acquired in ${lastYear}, starting from month ${
      //     acquisitionMonth + 1
      //   }`
      // );
    } else if (acquisitionYear > lastYear) {
      // Aset dibeli setelah tahun lalu, tidak ada depresiasi
      // console.log(`❌ Skipped: Asset acquired after ${lastYear}\n`);
      return;
    }

    // Jika depresiasi berakhir dalam tahun lalu
    if (depreciationEndYear === lastYear) {
      lastMonthInLastYear = depreciationEndMonth - 1; // Bulan terakhir yang didepresiasi (exclusive end)
      // console.log(
      //   `Depreciation ends in ${lastYear}, last month is ${
      //     lastMonthInLastYear + 1
      //   }`
      // );
    } else if (depreciationEndYear < lastYear) {
      // Depresiasi sudah berakhir sebelum tahun lalu
      // console.log(`❌ Skipped: Depreciation ended before ${lastYear}\n`);
      return;
    }

    // Hitung jumlah bulan dalam tahun lalu
    if (lastMonthInLastYear >= firstMonthInLastYear) {
      monthsInLastYear = lastMonthInLastYear - firstMonthInLastYear + 1;
    }

    // console.log(
    //   `Months in ${lastYear}: ${firstMonthInLastYear + 1} to ${
    //     lastMonthInLastYear + 1
    //   } = ${monthsInLastYear} months`
    // );

    // Tambahkan depresiasi untuk aset ini
    const assetDepreciation = monthsInLastYear * monthlyDepreciation;
    totalDepreciation += assetDepreciation;

    // console.log(
    //   `Asset Depreciation: ${monthsInLastYear} × ${monthlyDepreciation.toLocaleString()} = ${assetDepreciation.toLocaleString()}`
    // );
    // console.log(`Running Total: ${totalDepreciation.toLocaleString()}\n`);
  });

  // console.log(`=== FINAL RESULT ===`);
  // console.log(
  //   `Total Last Year Depreciation (${lastYear}): ${totalDepreciation.toLocaleString()}`
  // );
  // console.log(`========================\n`);

  return totalDepreciation;
}

module.exports = { calculateLastYearDepreciation };
