"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authSign = exports.getKeys = exports.getFingerprint = exports.formatPublicKey = exports.PrivateExport = exports.AuthData = exports.PublicKey = exports.SSHKeyType = exports.SSHBuf = exports.SSHString = void 0;
/*! micro-key-producer - MIT License (c) 2024 Paul Miller (paulmillr.com) */
const ed25519_1 = require("@noble/curves/ed25519");
const sha256_1 = require("@noble/hashes/sha256");
const utils_1 = require("@noble/hashes/utils");
const base_1 = require("@scure/base");
const P = require("micro-packed");
const utils_js_1 = require("./utils.js");
exports.SSHString = P.string(P.U32BE);
exports.SSHBuf = P.bytes(P.U32BE);
exports.SSHKeyType = P.magic(exports.SSHString, 'ssh-ed25519');
exports.PublicKey = P.struct({ keyType: exports.SSHKeyType, pubKey: P.bytes(P.U32BE) });
const PrivateKey = P.padRight(8, P.struct({
    check1: P.bytes(4),
    check2: P.bytes(4),
    keyType: exports.SSHKeyType,
    pubKey: exports.SSHBuf,
    privKey: exports.SSHBuf,
    comment: exports.SSHString,
}), (i) => i + 1);
// https://tools.ietf.org/html/draft-miller-ssh-agent-02#section-4.5
exports.AuthData = P.struct({
    nonce: exports.SSHBuf,
    userAuthRequest: P.U8, // == 50
    user: exports.SSHString,
    conn: exports.SSHString,
    auth: exports.SSHString,
    haveSig: P.U8, // == 1
    keyType: exports.SSHKeyType,
    pubKey: P.prefix(P.U32BE, exports.PublicKey),
});
exports.PrivateExport = (0, utils_js_1.base64armor)('openssh private key', 70, P.struct({
    magic: P.magicBytes('openssh-key-v1\0'),
    // Only decrypted ed25519 keys supported for now
    ciphername: P.magic(exports.SSHString, 'none'),
    kdfname: P.magic(exports.SSHString, 'none'),
    kdfopts: P.magic(exports.SSHString, ''),
    keys: P.array(P.U32BE, P.struct({
        pubKey: P.prefix(P.U32BE, exports.PublicKey),
        privKey: P.prefix(P.U32BE, PrivateKey),
    })),
}));
function formatPublicKey(bytes, comment) {
    const blob = exports.PublicKey.encode({ pubKey: bytes });
    return `ssh-ed25519 ${base_1.base64.encode(blob)}${comment ? ` ${comment}` : ''}`;
}
exports.formatPublicKey = formatPublicKey;
function getFingerprint(bytes) {
    const blob = exports.PublicKey.encode({ pubKey: bytes });
    // ssh-keygen -l -f ~/.ssh/id_ed25519
    // 256 SHA256:+WK/Sl4XJjoxDlAWYuhq4Fl2hka9j3GOUjYczQkqnCI user@comp.local (ED25519)
    return `SHA256:${base_1.base64.encode((0, sha256_1.sha256)(blob)).replace(/=$/, '')}`;
}
exports.getFingerprint = getFingerprint;
// For determenistic generation in tests
function getKeys(privateKey, comment, checkBytes = (0, utils_1.randomBytes)(4)) {
    const pubKey = ed25519_1.ed25519.getPublicKey(privateKey);
    return {
        publicKeyBytes: pubKey,
        publicKey: formatPublicKey(pubKey, comment),
        fingerprint: getFingerprint(pubKey),
        privateKey: exports.PrivateExport.encode({
            keys: [
                {
                    pubKey: { pubKey },
                    privKey: {
                        // Check bytes, should be same
                        check1: checkBytes,
                        check2: checkBytes,
                        pubKey,
                        privKey: (0, utils_1.concatBytes)(privateKey, pubKey),
                        comment: comment || '',
                    },
                },
            ],
        }),
    };
}
exports.getKeys = getKeys;
// For SSH Agents
function authSign(privateKey, data) {
    return ed25519_1.ed25519.sign(exports.AuthData.encode(data), privateKey);
}
exports.authSign = authSign;
exports.default = getKeys;
//# sourceMappingURL=ssh.js.map