import waLinkProvider from "./waLink.provider.js";

/**
 * Pluggable Messaging Provider Manager.
 * Defaults to 'wa-link' provider which generates wa.me links.
 * WhatsApp Business API or SMS providers can be registered here.
 */
class MessagingService {
  constructor() {
    this.providers = new Map();
    this.registerProvider("wa-link", waLinkProvider);
    this.defaultProvider = "wa-link";
  }

  registerProvider(name, providerInstance) {
    this.providers.set(name, providerInstance);
  }

  getProvider(name = this.defaultProvider) {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new Error(`Messaging provider '${name}' not found.`);
    }
    return provider;
  }

  generateLink(phone, message, providerName = this.defaultProvider) {
    return this.getProvider(providerName).generateLink(phone, message);
  }

  async sendMessage(phone, message, options = {}, providerName = this.defaultProvider) {
    return await this.getProvider(providerName).sendMessage(phone, message, options);
  }
}

export const messagingService = new MessagingService();
export default messagingService;
