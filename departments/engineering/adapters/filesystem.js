'use strict';

/**
 * adapters/filesystem.js
 * ---------------------------------------------------------------------------
 * Isolates all direct disk access. builders/package-builder.js and
 * runtime.js use this instead of calling `fs` directly, so the storage
 * mechanism (local disk today, object storage tomorrow) can change without
 * touching business logic.
 * ---------------------------------------------------------------------------
 */

const fs = require('fs/promises');
const path = require('path');

class FilesystemAdapter {
  async ensureDir(dirPath) {
    await fs.mkdir(dirPath, { recursive: true });
    return dirPath;
  }

  async writeFile(filePath, content) {
    await this.ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, content, 'utf8');
    return filePath;
  }

  /**
   * Materialize an in-memory { relativePath: content } file map onto disk
   * under `rootDir`. Used when packaging an artifact for the marketplace.
   */
  async writeFileMap(rootDir, fileMap) {
    const written = [];
    for (const [relativePath, content] of Object.entries(fileMap)) {
      const full = path.join(rootDir, relativePath);
      await this.writeFile(full, content);
      written.push(full);
    }
    return written;
  }

  async readFile(filePath) {
    return fs.readFile(filePath, 'utf8');
  }

  async exists(targetPath) {
    try {
      await fs.access(targetPath);
      return true;
    } catch {
      return false;
    }
  }
}

module.exports = { FilesystemAdapter };
