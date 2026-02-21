export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

export const formatNumber = (value: number, decimals: number = 2): string => {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};

export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${formatNumber(value, decimals)}%`;
};

export const formatWeight = (value: number): string => {
  if (value >= 1000) {
    return `${formatNumber(value / 1000, 2)} kg`;
  }
  return `${formatNumber(value, 2)} g`;
};

export const formatQuantity = (value: number): string => {
  return new Intl.NumberFormat("pt-BR").format(value);
};

export const truncateText = (text: string, length: number): string => {
  if (text.length <= length) return text;
  return text.substring(0, length) + "...";
};

export const capitalizeFirstLetter = (text: string): string => {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

export const formatPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  }
  return phone;
};

export const formatCPF = (cpf: string): string => {
  const cleaned = cpf.replace(/\D/g, "");
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9)}`;
  }
  return cpf;
};

export const formatCNPJ = (cnpj: string): string => {
  const cleaned = cnpj.replace(/\D/g, "");
  if (cleaned.length === 14) {
    return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8, 12)}-${cleaned.slice(12)}`;
  }
  return cnpj;
};

export const normalizeText = (str: string): string => {
  return str.toLowerCase()
    .replace(/[àáâãä]/g, "a")
    .replace(/[èéêë]/g, "e")
    .replace(/[ìíîï]/g, "i")
    .replace(/[òóôõö]/g, "o")
    .replace(/[ùúûü]/g, "u")
    .replace(/ç/g, "c")
    .replace(/s\b/g, "") // Remove plural 's' at end of words
    .replace(/\s+/g, " ")
    .trim();
};

export const matchWords = (target: string, inv: string): boolean => {
  if (target === inv) return true;
  if (target.startsWith(inv) || inv.startsWith(target)) return true;

  // Special case for eggs: if both contain 'ovo', check for specific conflicts
  if (target.includes('ovo') && inv.includes('ovo')) {
    const isFertileTarget = target.includes('fertil') || target.includes('galado');
    const isFertileInv = inv.includes('fertil') || inv.includes('galado');

    // If one is fertile and other isn't, they don't match
    if (isFertileTarget !== isFertileInv) return false;

    // Otherwise, allow matching (Ovo Tia matches Ovo Cru)
    return true;
  }

  // Fuzzy word check
  const tWords = target.split(' ').filter(w => w.length > 2);
  const significantWords = tWords.filter(w => w !== 'ovo');
  if (significantWords.length > 0) {
    return significantWords.some(w => inv.includes(w));
  }

  return target.includes(inv) || inv.includes(target);
};
