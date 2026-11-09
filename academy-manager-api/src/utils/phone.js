/**
 * Utility functions for Pakistani phone numbers.
 * Validates and normalizes Pakistani mobile numbers to 03XXXXXXXXX (11 digits).
 */

/**
 * Normalizes any format (+92 300 1234567, 0300-1234567, 923001234567) to standard 11 digits: 03XXXXXXXXX
 * @param {string} phone 
 * @returns {string}
 */
export function normalizePakistaniPhone(phone) {
  if (!phone || typeof phone !== "string") return "";
  let digits = phone.replace(/[^0-9]/g, "");

  if (digits.startsWith("923") && digits.length === 12) {
    digits = "0" + digits.slice(2);
  } else if (digits.startsWith("00923") && digits.length === 14) {
    digits = "0" + digits.slice(4);
  } else if (digits.startsWith("3") && digits.length === 10) {
    digits = "0" + digits;
  }

  return digits;
}

/**
 * Validates if the phone number is a valid 11-digit Pakistani mobile number starting with 03.
 * @param {string} phone 
 * @returns {boolean}
 */
export function isValidPakistaniPhone(phone) {
  const normalized = normalizePakistaniPhone(phone);
  return /^03[0-9]{9}$/.test(normalized);
}

/**
 * Formats 03001234567 to 0300-1234567
 * @param {string} phone 
 * @returns {string}
 */
export function formatPakistaniPhone(phone) {
  const norm = normalizePakistaniPhone(phone);
  if (norm.length === 11) {
    return `${norm.slice(0, 4)}-${norm.slice(4)}`;
  }
  return phone;
}

export default {
  normalizePakistaniPhone,
  isValidPakistaniPhone,
  formatPakistaniPhone,
};
