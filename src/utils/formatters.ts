export function formatCurrency(amount: number, currency: 'TZS' | 'USD' = 'TZS'): string {
  if (isNaN(amount)) return `${currency} 0`;

  if (currency === 'TZS') {
    return `TZS ${Math.round(amount).toLocaleString('en-US')}`;
  } else {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}

export function formatDate(dateString: string, lang: 'sw' | 'en' = 'sw'): string {
  if (!dateString || dateString === '-') return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;

    if (lang === 'sw') {
      const monthsSw = [
        'Januari', 'Februari', 'Machi', 'Aprili', 'Mei', 'Juni',
        'Julai', 'Agosti', 'Septemba', 'Oktoba', 'Novemba', 'Desemba'
      ];
      return `${d.getDate()} ${monthsSw[d.getMonth()]} ${d.getFullYear()}`;
    } else {
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    }
  } catch {
    return dateString;
  }
}

export function formatTime24(timeStr?: string): string {
  if (!timeStr || timeStr === '-') return '-';
  return timeStr;
}

// Convert numbers to Swahili words for official payslips and payment vouchers
export function amountInWordsSwahili(amount: number): string {
  const rounded = Math.round(amount);
  if (rounded === 0) return 'Sifuri Tu';

  const units = ['', 'Moja', 'Mbili', 'Tatu', 'Nne', 'Tano', 'Sita', 'Saba', 'Nane', 'Tisa'];
  const tens = ['', 'Kumi', 'Ishirini', 'Thelathini', 'Arobaini', 'Hamsini', 'Sitini', 'Sabini', 'Hamsini na Nane', 'Tisini'];

  function convertBelowThousand(n: number): string {
    let result = '';
    const hundreds = Math.floor(n / 100);
    const remainder = n % 100;

    if (hundreds > 0) {
      result += (hundreds === 1 ? 'Mia Moja' : `Mia ${units[hundreds]}`);
      if (remainder > 0) result += ' na ';
    }

    if (remainder > 0) {
      if (remainder < 10) {
        result += units[remainder];
      } else if (remainder === 10) {
        result += 'Kumi';
      } else if (remainder < 20) {
        result += `Kumi na ${units[remainder % 10]}`;
      } else {
        const t = Math.floor(remainder / 10);
        const u = remainder % 10;
        result += tens[t];
        if (u > 0) result += ` na ${units[u]}`;
      }
    }

    return result;
  }

  let words = '';
  const millions = Math.floor(rounded / 1000000);
  const thousands = Math.floor((rounded % 1000000) / 1000);
  const rest = rounded % 1000;

  if (millions > 0) {
    words += (millions === 1 ? 'Milioni Moja' : `Milioni ${convertBelowThousand(millions)}`);
    if (thousands > 0 || rest > 0) words += ' ';
  }

  if (thousands > 0) {
    words += (thousands === 1 ? 'Elfu Moja' : `Elfu ${convertBelowThousand(thousands)}`);
    if (rest > 0) words += ' na ';
  }

  if (rest > 0) {
    words += convertBelowThousand(rest);
  }

  return `Shilingi ${words} Tu`;
}

export function amountInWordsEnglish(amount: number): string {
  const rounded = Math.round(amount);
  if (rounded === 0) return 'Zero Only';

  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(num: number): string {
    if (num < 20) return a[num];
    const digit = num % 10;
    if (num < 100) return b[Math.floor(num / 10)] + (digit ? '-' + a[digit] : '');
    if (num < 1000) return a[Math.floor(num / 100)] + ' Hundred' + (num % 100 === 0 ? '' : ' and ' + inWords(num % 100));
    if (num < 1000000) return inWords(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 !== 0 ? ' ' + inWords(num % 1000) : '');
    return inWords(Math.floor(num / 1000000)) + ' Million' + (num % 1000000 !== 0 ? ' ' + inWords(num % 1000000) : '');
  }

  return `${inWords(rounded)} Only`;
}

export function formatAmountInWords(amount: number, lang: 'sw' | 'en' = 'sw', currency: 'TZS' | 'USD' = 'TZS'): string {
  if (lang === 'sw') {
    return amountInWordsSwahili(amount);
  } else {
    const curName = currency === 'TZS' ? 'Tanzanian Shillings' : 'US Dollars';
    return `${curName} ${amountInWordsEnglish(amount)}`;
  }
}

