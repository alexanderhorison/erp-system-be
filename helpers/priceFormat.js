const priceFormat = value => {
  if (!value) {
    return ''
  }
  const numberFormatter = new Intl.NumberFormat('en-US')

  return numberFormatter.format(value)
}

const priceFormatWIthCurrency = value => {
  const numberFormatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    currencyDisplay: 'symbol',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });

  return `Rp.${numberFormatter.format(value).replace('Rp', '')}`;
};


const priceFormatWithZero = value => {
  if (isNaN(value)) {
    return ''
  }
  const numberFormatter = new Intl.NumberFormat('en-US')

  return numberFormatter.format(value)
}

module.exports = {
  priceFormat,
  priceFormatWIthCurrency,
  priceFormatWithZero,
}
