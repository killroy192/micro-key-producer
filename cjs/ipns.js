"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getKeys = exports.parseAddress = exports.formatPublicKey = void 0;
/*! micro-key-producer - MIT License (c) 2024 Paul Miller (paulmillr.com) */
const ed25519_1 = require("@noble/curves/ed25519");
const utils_1 = require("@noble/hashes/utils");
const base_1 = require("@scure/base");
const base36 = base_1.utils.chain(base_1.utils.radix(36), base_1.utils.alphabet('0123456789abcdefghijklmnopqrstuvwxyz'), base_1.utils.padding(0), base_1.utils.join(''));
// Formats IPNS public key in bytes array format to 'ipns://k...' string format
function formatPublicKey(pubBytes) {
    return `ipns://k${base36.encode(pubBytes)}`;
}
exports.formatPublicKey = formatPublicKey;
// Takes an IPNS pubkey (address) string as input and returns bytes array of the key
// Supports various formats ('ipns://k', 'ipns://b', 'ipns://f')
// Handles decoding and validation of the key before returning pubkey bytes
function parseAddress(address) {
    address = address.toLowerCase();
    if (address.startsWith('ipns://'))
        address = address.slice(7);
    let hexKey;
    if (address.startsWith('k')) {
        // Decode base-36 pubkey (after removing 'k' prefix) and encode it as a hex string
        hexKey = base_1.hex.encode(base36.decode(address.slice(1)));
    }
    else if (address.startsWith('b')) {
        // Decode base-32 pubkey (after removing 'b' prefix) and encode it as a hex string
        hexKey = base_1.hex.encode(base_1.base32.decode(address.slice(1).toUpperCase()));
    }
    else if (address.startsWith('f')) {
        hexKey = address.slice(1);
    }
    else
        throw new Error('Unsupported Base-X Format'); // Throw error if pubkey format is not supported
    // Check if hexKey has expected prefix '0172002408011220' and length of 80
    if (hexKey.startsWith('0172002408011220') && hexKey.length === 80) {
        return base_1.hex.decode(hexKey);
    }
    // Throw error if IPNS key prefix is invalid
    throw new Error('Invalid IPNS Key Prefix: ' + hexKey);
}
exports.parseAddress = parseAddress;
// Generates an ed25519 pubkey from a seed and converts it to several IPNS pubkey formats
function getKeys(seed) {
    //? privKey "seed" should be checked for <ed25519.curve.n?
    if (seed.length !== 32)
        throw new TypeError('Seed must be 32 bytes in length');
    // Generate ed25519 public key from seed
    const pubKey = ed25519_1.ed25519.getPublicKey(seed);
    // Create public key bytes by concatenating prefix bytes and pubKey
    const pubKeyBytes = (0, utils_1.concatBytes)(new Uint8Array([0x01, 0x72, 0x00, 0x24, 0x08, 0x01, 0x12, 0x20]), pubKey);
    const hexKey = base_1.hex.encode(pubKeyBytes).toLowerCase();
    // Return different representations of the keys
    return {
        publicKey: `0x${hexKey}`,
        privateKey: `0x${base_1.hex.encode((0, utils_1.concatBytes)(new Uint8Array([0x08, 0x01, 0x12, 0x40]), seed, pubKey))}`,
        base36: `ipns://k${base36.encode(pubKeyBytes)}`,
        base32: `ipns://b${base_1.base32.encode(pubKeyBytes).toLowerCase()}`,
        base16: `ipns://f${hexKey}`,
        contenthash: `0xe501${hexKey}`,
    };
}
exports.getKeys = getKeys;
exports.default = getKeys;
//# sourceMappingURL=ipns.js.map