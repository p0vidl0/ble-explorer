#!/usr/bin/env node
/** Writes solid-color PNGs for PWA (no deps). */
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';

const CRC_TABLE = new Uint32Array(256).map((_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) {
        c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    return c >>> 0;
});

function crc32(buf) {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
        crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const body = Buffer.concat([typeBuf, data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(body), 0);
    return Buffer.concat([len, body, crc]);
}

function pngSolidRgba(width, height, r, g, b, a = 255) {
    const rowLen = width * 4 + 1;
    const raw = Buffer.alloc(height * rowLen);
    let o = 0;
    const px = Buffer.from([r, g, b, a]);
    for (let y = 0; y < height; y++) {
        raw[o++] = 0;
        for (let x = 0; x < width; x++) {
            px.copy(raw, o);
            o += 4;
        }
    }
    const idat = deflateSync(raw, { level: 9 });
    const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const ihdrData = Buffer.alloc(13);
    ihdrData.writeUInt32BE(width, 0);
    ihdrData.writeUInt32BE(height, 4);
    ihdrData.writeUInt8(8, 8);
    ihdrData.writeUInt8(6, 9);
    ihdrData.writeUInt8(0, 10);
    ihdrData.writeUInt8(0, 11);
    ihdrData.writeUInt8(0, 12);
    return Buffer.concat([sig, chunk('IHDR', ihdrData), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

async function writePng(fileUrl, size) {
    const buf = pngSolidRgba(size, size, 0x25, 0x63, 0xeb, 255);
    await writeFile(fileURLToPath(fileUrl), buf);
}

await writePng(new URL('../src/icons/icon-192.png', import.meta.url), 192);
await writePng(new URL('../src/icons/icon-512.png', import.meta.url), 512);
