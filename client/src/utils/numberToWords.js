export function numberToWordsINR(amount) {
  if (amount === 0 || amount === '0') return 'Rupees Zero Only';
  if (!amount || isNaN(amount)) return '';

  const num = parseFloat(amount);
  const integerPart = Math.floor(Math.abs(num));
  const decimalPart = Math.round((Math.abs(num) - integerPart) * 100);

  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
  ];

  const tens = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
  ];

  function convertTwoDigits(n) {
    if (n === 0) return '';
    if (n < 20) return ones[n];
    const t = Math.floor(n / 10);
    const o = n % 10;
    return tens[t] + (o > 0 ? ' ' + ones[o] : '');
  }

  function convertThreeDigits(n) {
    const h = Math.floor(n / 100);
    const rest = n % 100;
    let res = '';
    if (h > 0) {
      res += ones[h] + ' Hundred';
      if (rest > 0) res += ' ';
    }
    if (rest > 0) {
      res += convertTwoDigits(rest);
    }
    return res;
  }

  let words = '';
  let remaining = integerPart;

  const crores = Math.floor(remaining / 10000000);
  remaining %= 10000000;

  const lakhs = Math.floor(remaining / 100000);
  remaining %= 100000;

  const thousands = Math.floor(remaining / 1000);
  remaining %= 1000;

  const hundreds = remaining;

  if (crores > 0) words += convertTwoDigits(crores) + ' Crore ';
  if (lakhs > 0) words += convertTwoDigits(lakhs) + ' Lakh ';
  if (thousands > 0) words += convertTwoDigits(thousands) + ' Thousand ';
  if (hundreds > 0) words += convertThreeDigits(hundreds) + ' ';

  words = words.trim();
  let result = 'Rupees ' + words;

  if (decimalPart > 0) {
    result += ' and ' + convertTwoDigits(decimalPart) + ' Paise';
  }

  result += ' Only';
  return result;
}
