import path from "path";
import fs from "fs";
import logger from "../utils/logger.js";

/**
 * Local Disk Storage Provider.
 */
class LocalStorageProvider {
  constructor() {
    this.name = "local";
    this.rootUploadDir = path.resolve(process.cwd(), "uploads");
  }

  /**
   * Resolves a public URL (/uploads/type/file.ext) to absolute disk path.
   * @param {string} fileUrl
   * @returns {string|null}
   */
  resolveDiskPath(fileUrl) {
    if (!fileUrl || typeof fileUrl !== "string") return null;
    const cleanUrl = fileUrl.replace(/^\/+/, ""); // strip leading slashes
    return path.resolve(process.cwd(), cleanUrl);
  }

  /**
   * Saves a file record and returns its public relative URL.
   *
   * @param {object} file - Express.Multer file object
   * @param {string} type - Sub-directory type (e.g. 'students', 'logos', 'documents')
   * @returns {Promise<{ url: string, filename: string, size: number, mimetype: string }>}
   */
  async save(file, type = "general") {
    if (!file) throw new Error("No file provided to storage provider.");

    const relativeUrl = `/uploads/${type}/${file.filename}`;
    return {
      url: relativeUrl,
      filename: file.filename,
      size: file.size,
      mimetype: file.mimetype,
      provider: this.name,
    };
  }

  /**
   * Safely deletes an existing file from disk by URL.
   *
   * @param {string} fileUrl - Public URL to delete (e.g. '/uploads/logos/logo-123.png')
   * @returns {Promise<boolean>}
   */
  async delete(fileUrl) {
    if (!fileUrl) return false;
    try {
      const diskPath = this.resolveDiskPath(fileUrl);
      if (diskPath && fs.existsSync(diskPath)) {
        await fs.promises.unlink(diskPath);
        logger.info(`[STORAGE] Deleted file from disk: ${diskPath}`);
        return true;
      }
    } catch (err) {
      logger.warn(`[STORAGE] Failed to delete file at ${fileUrl}: ${err.message}`);
    }
    return false;
  }

  /**
   * Generates public URL for a filename and type.
   */
  getUrl(filename, type = "general") {
    return `/uploads/${type}/${filename}`;
  }

  /**
   * Replaces an old file with a newly uploaded one, cleaning up previous file.
   *
   * @param {string|null} oldFileUrl
   * @param {object} newFile
   * @param {string} type
   * @returns {Promise<{ url: string, filename: string }>}
   */
  async replace(oldFileUrl, newFile, type = "general") {
    if (oldFileUrl) {
      await this.delete(oldFileUrl);
    }
    return await this.save(newFile, type);
  }
}

/**
 * Storage Service Manager.
 * Enables switching to S3, Cloudinary, or GCS by setting provider.
 */
class StorageService {
  constructor() {
    this.providers = new Map();
    this.registerProvider("local", new LocalStorageProvider());
    this.defaultProvider = "local";
  }

  registerProvider(name, instance) {
    this.providers.set(name, instance);
  }

  getProvider(name = this.defaultProvider) {
    const provider = this.providers.get(name);
    if (!provider) throw new Error(`Storage provider '${name}' not found.`);
    return provider;
  }

  async save(file, type) {
    return await this.getProvider().save(file, type);
  }

  async delete(fileUrl) {
    return await this.getProvider().delete(fileUrl);
  }

  async replace(oldFileUrl, newFile, type) {
    return await this.getProvider().replace(oldFileUrl, newFile, type);
  }

  getUrl(filename, type) {
    return this.getProvider().getUrl(filename, type);
  }
}

export const storageService = new StorageService();
export default storageService;
