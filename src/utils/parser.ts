import type { Wallet } from '../services/api';

export interface ParsedResult {
  amount?: number;
  description?: string;
  type?: 'income' | 'expense' | 'transfer';
  walletId?: string;
  destinationWalletId?: string;
  category?: string;
}



export const parseQuickInput = (text: string, wallets: Wallet[]): ParsedResult => {
  const result: ParsedResult = {
    type: 'expense',
  };

  if (!text) return result;

  const lowerText = text.toLowerCase().trim();

  // 1. Detect Type (Income, Transfer, Expense)
  const incomeKeywords = ['lương', 'luong', 'thu', 'nhận', 'nhan', 'freelance', 'thưởng', 'thuong', 'được tặng', 'du an', 'dự án'];
  const transferKeywords = ['chuyển', 'chuyen', 'qua', 'sang', '->', 'to', 'transfer'];
  
  const hasPlus = lowerText.startsWith('+');

  if (hasPlus || incomeKeywords.some(kw => lowerText.includes(kw))) {
    result.type = 'income';
  } else if (transferKeywords.some(kw => lowerText.includes(kw))) {
    result.type = 'transfer';
  }

  // 2. Parse Amount (Matches e.g. "35k", "35.000", "5tr", "1.5m", "120000", etc.)
  const amountRegex = /(\d+[\d.,]*)\s*(k|tr|m|đ|d|vnd)?\b/i;
  const match = lowerText.match(amountRegex);

  let parsedAmount = 0;
  let rawAmountString = '';

  if (match) {
    rawAmountString = match[0];
    const numStr = match[1].replace(/[.,]/g, '');
    let num = parseFloat(numStr);
    const unit = (match[2] || '').toLowerCase();

    if (unit === 'k') {
      num = num * 1000;
    } else if (unit === 'tr' || unit === 'm') {
      num = num * 1000000;
    } else if (num < 1000 && !unit) {
      // If user typed e.g. "35" without unit, they likely mean "35k" (35,000 VND)
      num = num * 1000;
    }
    parsedAmount = num;
    result.amount = parsedAmount;
  }

  // 3. Parse Description (Remove amount string)
  let desc = text;
  if (rawAmountString) {
    desc = desc.replace(new RegExp(rawAmountString, 'i'), '');
  }

  // 4. Parse Wallets
  const foundWallets: string[] = [];
  const cleanLowerText = lowerText.replace(/[+\->]/g, ' ');

  wallets.forEach(w => {
    const wName = w.name.toLowerCase();
    const normalizedwName = wName.replace(/\s+/g, '');
    
    // Split input into words to check
    const cleanWords = cleanLowerText.split(/\s+/);
    
    const isMatched = cleanWords.some(word => 
      word.length >= 3 && (
        word.includes(normalizedwName) || 
        normalizedwName.includes(word) ||
        wName.includes(word)
      )
    );

    if (isMatched) {
      foundWallets.push(w.id);
    }
  });

  if (result.type === 'transfer') {
    if (foundWallets.length >= 2) {
      result.walletId = foundWallets[0];
      result.destinationWalletId = foundWallets[1];
    } else if (foundWallets.length === 1) {
      result.walletId = foundWallets[0];
    }
  } else {
    if (foundWallets.length >= 1) {
      result.walletId = foundWallets[0];
    }
  }

  // Clean wallet names from description
  wallets.forEach(w => {
    desc = desc.replace(new RegExp(w.name, 'gi'), '');
    const shortName = w.name.split(' ')[0];
    if (shortName.length >= 3) {
      desc = desc.replace(new RegExp(shortName, 'gi'), '');
    }
  });

  // Clean up common connector words
  desc = desc.replace(/(chuyển|chuyen|qua|sang|cho|\+|->|to|từ|tu)/gi, ' ');
  desc = desc.replace(/\s+/g, ' ').trim();

  if (desc) {
    desc = desc.charAt(0).toUpperCase() + desc.slice(1);
    result.description = desc;
  }

  // 5. Guess Category based on description
  const cleanDesc = (desc || '').toLowerCase();

  if (result.type === 'transfer') {
    result.category = 'Chuyển khoản';
  } else if (result.type === 'income') {
    if (cleanDesc.includes('lương') || cleanDesc.includes('salary')) result.category = 'Lương';
    else if (cleanDesc.includes('freelance') || cleanDesc.includes('dự án') || cleanDesc.includes('code')) result.category = 'Freelance';
    else if (cleanDesc.includes('tặng') || cleanDesc.includes('cho') || cleanDesc.includes('biếu')) result.category = 'Được tặng';
    else if (cleanDesc.includes('đầu tư') || cleanDesc.includes('lãi')) result.category = 'Đầu tư';
    else if (/(nợ|no|vay|mượn|muon|trả|tra)/i.test(cleanDesc)) result.category = 'Nợ';
    else result.category = 'Khác';
  } else {
    // Expense categories
    if (/(nợ|no|cho vay|vay|mượn|muon|trả|tra)/i.test(cleanDesc)) {
      result.category = 'Nợ';
    } else if (/(bánh|banh|ăn|an|uống|uong|cf|cafe|cà phê|cơm|com|bún|phở|pho|trà|tra|sữa|sua|lẩu|lau|thịt|cá|rau|nhậu|nhau)/i.test(cleanDesc)) {
      result.category = 'Ăn uống';
    } else if (/(áo|quần|ao|quan|giày|dep|shopee|lazada|tiki|mua|sắm|sam|mall|tivi|điện thoại|quà|qua)/i.test(cleanDesc)) {
      result.category = 'Mua sắm';
    } else if (/(nhà|phòng|phong|trọ|tro|điện|nước|nuoc|internet|wifi|chung cư)/i.test(cleanDesc)) {
      result.category = 'Tiền nhà';
    } else if (/(xăng|xang|xe|grab|be|gojek|taxi|vé|ve|gửi xe|gui xe)/i.test(cleanDesc)) {
      result.category = 'Xăng xe';
    } else if (/(thuốc|thuoc|khám|bệnh|vien|gym|sức khỏe|suc khoe|bảo hiểm|bác sĩ)/i.test(cleanDesc)) {
      result.category = 'Sức khỏe';
    } else if (/(phim|netflix|chơi|game|du lịch|dulich|bar|pub|karaoke|hát|hat)/i.test(cleanDesc)) {
      result.category = 'Giải trí';
    } else if (/(sách|sach|học|hoc|khóa học|khoahoc|trường|truong|lớp|lop)/i.test(cleanDesc)) {
      result.category = 'Học tập';
    } else {
      result.category = 'Khác';
    }
  }

  return result;
};
