"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.base64armor = exports.randomBytes = void 0;
const utils_1 = require("@noble/hashes/utils");
Object.defineProperty(exports, "randomBytes", { enumerable: true, get: function () { return utils_1.randomBytes; } });
const micro_packed_1 = require("micro-packed");
const base_1 = require("@scure/base");
/**
 * Base64-armored values are commonly used in cryptographic applications, such as PGP and SSH.
 * @param name - The name of the armored value.
 * @param lineLen - Maximum line length for the armored value (e.g., 64 for GPG, 70 for SSH).
 * @param inner - Inner CoderType for the value.
 * @param checksum - Optional checksum function.
 * @returns Coder representing the base64-armored value.
 * @example
 * // Base64-armored value without checksum
 * const armoredValue = P.base64armor('EXAMPLE', 64, P.bytes(null));
 */
function base64armor(name, lineLen, inner, checksum) {
    if (typeof name !== 'string' || name.length === 0)
        throw new Error('name must be a non-empty string');
    if (!Number.isSafeInteger(lineLen) || lineLen <= 0)
        throw new Error('lineLen must be a positive integer');
    if (!micro_packed_1.utils.isCoder(inner))
        throw new Error('inner must be a valid base coder');
    if (checksum !== undefined && typeof checksum !== 'function')
        throw new Error('checksum must be a function or undefined');
    const upcase = name.toUpperCase();
    const markBegin = '-----BEGIN ' + upcase + '-----';
    const markEnd = '-----END ' + upcase + '-----';
    return {
        encode(value) {
            const data = inner.encode(value);
            const encoded = base_1.base64.encode(data);
            const lines = [];
            for (let i = 0; i < encoded.length; i += lineLen) {
                const s = encoded.slice(i, i + lineLen);
                if (s.length)
                    lines.push(encoded.slice(i, i + lineLen) + '\n');
            }
            let body = lines.join('');
            if (checksum)
                body += '=' + base_1.base64.encode(checksum(data)) + '\n';
            return markBegin + '\n\n' + body + markEnd + '\n';
        },
        decode(s) {
            if (typeof s !== 'string')
                throw new Error('string expected');
            const beginPos = s.indexOf(markBegin);
            const endPos = s.indexOf(markEnd);
            if (beginPos === -1 || endPos === -1 || beginPos >= endPos)
                throw new Error('invalid armor format');
            let lines = s.replace(markBegin, '').replace(markEnd, '').trim().split('\n');
            if (lines.length === 0)
                throw new Error('no data found in armor');
            lines = lines.map((l) => l.replace('\r', '').trim());
            const last = lines.length - 1;
            if (checksum && lines[last].startsWith('=')) {
                const body = base_1.base64.decode(lines.slice(0, -1).join(''));
                const cs = lines[last].slice(1);
                const realCS = base_1.base64.encode(checksum(body));
                if (realCS !== cs)
                    throw new Error('invalid checksum ' + cs + 'instead of ' + realCS);
                return inner.decode(body);
            }
            return inner.decode(base_1.base64.decode(lines.join('')));
        },
    };
}
exports.base64armor = base64armor;
//# sourceMappingURL=utils.js.map