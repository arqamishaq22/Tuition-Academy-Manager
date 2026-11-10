import { toInternationalPakistaniPhone } from "../../utils/phone.js";

/**
 * WhatsApp Direct Link Provider ('wa-link').
 * Generates ready-to-send wa.me URLs for client-side opening.
 * Serves as the default pluggable messaging implementation.
 */
export class WaLinkProvider {
  constructor() {
    this.name = "wa-link";
    this.channel = "whatsapp";
  }

  /**
   * Normalizes a phone number to international format (e.g. 923XXXXXXXXX).
   * @param {string} phone
   * @returns {string}
   */
  normalizeRecipient(phone) {
    return toInternationalPakistaniPhone(phone);
  }

  /**
   * Generates a wa.me direct link with URL-encoded text.
   * @param {string} phone
   * @param {string} message
   * @returns {string}
   */
  generateLink(phone, message) {
    const intlPhone = this.normalizeRecipient(phone);
    const encodedText = encodeURIComponent(message);
    return `https://wa.me/${intlPhone}?text=${encodedText}`;
  }

  /**
   * Dispatches/prepares message.
   * For wa-link provider, it returns the generated direct link.
   *
   * @param {string} phone
   * @param {string} message
   * @param {object} options
   * @returns {Promise<object>}
   */
  async sendMessage(phone, message, options = {}) {
    const intlPhone = this.normalizeRecipient(phone);
    const link = this.generateLink(phone, message);

    return {
      success: true,
      channel: this.channel,
      provider: this.name,
      recipient: intlPhone,
      message,
      link,
      dispatchedAt: new Date().toISOString(),
      metadata: options.metadata || {},
    };
  }
}

export default new WaLinkProvider();
