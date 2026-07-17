'use strict';

/**
 * adapters/archiver.js
 * ---------------------------------------------------------------------------
 * Minimal, dependency-free ZIP writer used to produce the distributable
 * Marketplace package (DepartmentName-Version.zip). Isolated behind this
 * adapter so builders/package-builder.js never has to know the archive
 * format details.
 * ---------------------------------------------------------------------------
 */

const fs = require('fs/promises');
const path = require('path');
const zlib = require('zlib');

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function dosDateTime(date = new Date()) {
  const time = ((date.getHours() << 11) | (date.getMinutes() << 5) | (date.getSeconds() >> 1)) & 0xffff;
  const dosDate = (((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate()) & 0xffff;
  return { time, dosDate };
}

async function collectFiles(rootDir, base = rootDir, acc = []) {
  const entries = await fs.readdir(base, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(base, entry.name);
    if (entry.isDirectory()) {
      await collectFiles(rootDir, full, acc);
    } else {
      acc.push({ full, relative: path.relative(rootDir, full).split(path.sep).join('/') });
    }
  }
  return acc;
}

class ArchiverAdapter {
  /** Zip an entire directory tree into a single .zip file (DEFLATE compression). */
  async zipDirectory(sourceDir, zipPath) {
    const files = await collectFiles(sourceDir);
    const { time, dosDate } = dosDateTime();

    const localParts = [];
    const centralParts = [];
    let offset = 0;

    for (const file of files) {
      const data = await fs.readFile(file.full);
      const compressed = zlib.deflateRawSync(data);
      const crc = crc32(data);
      const nameBuf = Buffer.from(file.relative, 'utf8');

      const localHeader = Buffer.alloc(30);
      localHeader.writeUInt32LE(0x04034b50, 0);
      localHeader.writeUInt16LE(20, 4);
      localHeader.writeUInt16LE(0, 6);
      localHeader.writeUInt16LE(8, 8); // DEFLATE
      localHeader.writeUInt16LE(time, 10);
      localHeader.writeUInt16LE(dosDate, 12);
      localHeader.writeUInt32LE(crc, 14);
      localHeader.writeUInt32LE(compressed.length, 18);
      localHeader.writeUInt32LE(data.length, 22);
      localHeader.writeUInt16LE(nameBuf.length, 26);
      localHeader.writeUInt16LE(0, 28);

      localParts.push(localHeader, nameBuf, compressed);

      const centralHeader = Buffer.alloc(46);
      centralHeader.writeUInt32LE(0x02014b50, 0);
      centralHeader.writeUInt16LE(20, 4);
      centralHeader.writeUInt16LE(20, 6);
      centralHeader.writeUInt16LE(0, 8);
      centralHeader.writeUInt16LE(8, 10);
      centralHeader.writeUInt16LE(time, 12);
      centralHeader.writeUInt16LE(dosDate, 14);
      centralHeader.writeUInt32LE(crc, 16);
      centralHeader.writeUInt32LE(compressed.length, 20);
      centralHeader.writeUInt32LE(data.length, 24);
      centralHeader.writeUInt16LE(nameBuf.length, 28);
      centralHeader.writeUInt16LE(0, 30);
      centralHeader.writeUInt16LE(0, 32);
      centralHeader.writeUInt16LE(0, 34);
      centralHeader.writeUInt16LE(0, 36);
      centralHeader.writeUInt32LE(0, 38);
      centralHeader.writeUInt32LE(offset, 42);

      centralParts.push(centralHeader, nameBuf);
      offset += localHeader.length + nameBuf.length + compressed.length;
    }

    const centralStart = offset;
    const centralBuf = Buffer.concat(centralParts);

    const end = Buffer.alloc(22);
    end.writeUInt32LE(0x06054b50, 0);
    end.writeUInt16LE(0, 4);
    end.writeUInt16LE(0, 6);
    end.writeUInt16LE(files.length, 8);
    end.writeUInt16LE(files.length, 10);
    end.writeUInt32LE(centralBuf.length, 12);
    end.writeUInt32LE(centralStart, 16);
    end.writeUInt16LE(0, 20);

    const zipBuffer = Buffer.concat([...localParts, centralBuf, end]);
    await fs.mkdir(path.dirname(zipPath), { recursive: true });
    await fs.writeFile(zipPath, zipBuffer);
    return zipPath;
  }
}

module.exports = { ArchiverAdapter };
