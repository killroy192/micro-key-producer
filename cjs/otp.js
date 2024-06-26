"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.totp = exports.hotp = exports.buildURL = exports.parse = void 0;
/*! micro-key-producer - MIT License (c) 2024 Paul Miller (paulmillr.com) */
const hmac_1 = require("@noble/hashes/hmac");
const sha1_1 = require("@noble/hashes/sha1");
const sha2_1 = require("@noble/hashes/sha2");
const base_1 = require("@scure/base");
const micro_packed_1 = require("micro-packed");
function parseSecret(secret) {
    const len = Math.ceil(secret.length / 8) * 8;
    return base_1.base32.decode(secret.padEnd(len, '=').toUpperCase());
}
function parse(otp) {
    const opts = { secret: new Uint8Array(), algorithm: 'sha1', digits: 6, interval: 30 };
    if (otp.startsWith('otpauth://totp/')) {
        // @ts-ignore
        if (typeof URL === 'undefined')
            throw new Error('global variable URL must be defined');
        // @ts-ignore
        const url = new URL(otp);
        if (url.protocol !== 'otpauth:' || url.host !== 'totp')
            throw new Error('OTP: wrong url');
        const params = url.searchParams;
        const digits = params.get('digits');
        if (digits) {
            const parsed = Number.parseInt(digits);
            if (![6, 7, 8].includes(parsed))
                throw new Error(`OTP: url should include 6, 7 or 8 digits. Got: ${digits}`);
            opts.digits = parsed;
        }
        const algo = params.get('algorithm');
        if (algo) {
            const lower = algo.toLowerCase();
            if (!['sha1', 'sha256', 'sha512'].includes(lower))
                throw new Error(`OTP: url with unsupported algorithm: ${algo}`);
            opts.algorithm = lower;
        }
        const secret = params.get('secret');
        if (!secret)
            throw new Error('OTP: url without secret');
        opts.secret = parseSecret(secret);
    }
    else {
        opts.secret = parseSecret(otp);
    }
    return opts;
}
exports.parse = parse;
function buildURL(opts) {
    const sec = base_1.base32.encode(opts.secret).replace(/=/gm, '');
    const int_ = opts.interval;
    const algo = opts.algorithm.toUpperCase();
    return `otpauth://totp/?secret=${sec}&interval=${int_}&digits=${opts.digits}&algorithm=${algo}`;
}
exports.buildURL = buildURL;
function hotp(opts, counter) {
    const hash = { sha1: sha1_1.sha1, sha256: sha2_1.sha256, sha512: sha2_1.sha512 }[opts.algorithm];
    if (!hash)
        throw new Error(`TOTP: unknown hash: ${opts.algorithm}`);
    const mac = (0, hmac_1.hmac)(hash, opts.secret, micro_packed_1.U64BE.encode(BigInt(counter)));
    const offset = mac[mac.length - 1] & 0x0f;
    const num = micro_packed_1.U32BE.decode(mac.slice(offset, offset + 4)) & 0x7fffffff;
    return num.toString().slice(-opts.digits).padStart(opts.digits, '0');
}
exports.hotp = hotp;
function totp(opts, ts = Date.now()) {
    return hotp(opts, Math.floor(ts / (opts.interval * 1000)));
}
exports.totp = totp;
//# sourceMappingURL=otp.js.map