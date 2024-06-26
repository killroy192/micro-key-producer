import assert from 'node:assert';
import { should, describe } from 'micro-should';
import { sha256 } from '@noble/hashes/sha256';
import * as pwd from '../esm/password.js';

describe('password', () => {
  should('Set utils', () => {
    const a = new Set([1, 2, 3, 4]);
    const b = new Set([2, 3, 4, 5]);
    const c = new Set([3, 4, 5, 6]);
    assert.deepStrictEqual(pwd.and(a, b, c), new Set([3, 4]));
    assert.deepStrictEqual(pwd.or(a, b, c), new Set([1, 2, 3, 4, 5, 6]));

    const aa = new Set('abc');
    const bb = new Set('def');
    const cc = new Set('qr');
    // prettier-ignore
    assert.deepStrictEqual(pwd.product(aa, bb, cc), new Set([
        'adq', 'adr', 'aeq', 'aer', 'afq', 'afr',
        'bdq', 'bdr', 'beq', 'ber', 'bfq', 'bfr',
        'cdq', 'cdr', 'ceq', 'cer', 'cfq', 'cfr',
      ]));
  });
  should('Mask utils', () => {
    assert.deepStrictEqual(pwd.mask('11').cardinality, 100n);
    assert.deepStrictEqual(pwd.mask('aa').cardinality, 26n * 26n);
    assert.deepStrictEqual(pwd.mask('aaaa-aaaa').cardinality, 26n ** 8n);
    // len(bin(100).replace('0b',''))-1 (since last bit is not fully used if number is not power of two)
    assert.deepStrictEqual(pwd.cardinalityBits(100n), 6);
    assert.deepStrictEqual(pwd.cardinalityBits(64n), 6);
    assert.deepStrictEqual(pwd.cardinalityBits(63n), 5);
    assert.deepStrictEqual(pwd.cardinalityBits(31n), 4);
    assert.deepStrictEqual(pwd.cardinalityBits(0xffff_ffff_ffff_ffffn), 63);
    assert.deepStrictEqual(pwd.cardinalityBits(0xffff_ffff_ffff_fff0n), 63);
    assert.deepStrictEqual(pwd.cardinalityBits(0x1fff_ffff_ffff_fff0n), 60);
    const entropy = sha256('hello world');
    // Inverse works
    for (const m of ['@Ss-ss-ss', '************', 'AaAa+AaA11..@@@@'])
      assert.deepStrictEqual(pwd.mask(m).inverse(pwd.mask(m).apply(entropy)), entropy);
    // Just for research
    assert.deepStrictEqual(pwd.mask('aa').entropy, 9);
    assert.deepStrictEqual(pwd.mask('Aaaaaa@1').entropy, 36);
    assert.deepStrictEqual(pwd.mask('********').entropy, 52);
    assert.deepStrictEqual(pwd.mask('****-****-*').entropy, 58);
    assert.deepStrictEqual(pwd.mask('****-****-**').entropy, 65);
    assert.deepStrictEqual(pwd.mask('****-****-***').entropy, 72);
    assert.deepStrictEqual(pwd.mask('****-****-****').entropy, 78);
    assert.deepStrictEqual(pwd.mask('@Ss-ss-ss').entropy, 46);
    assert.deepStrictEqual(pwd.mask('Sss-sss-ssc1').entropy, 62);
    assert.deepStrictEqual(pwd.mask('Cvccvc-cvccvc-cvccv1').entropy, 66);
  });
  should('checkPassword', () => {
    assert.deepStrictEqual(pwd.checkPassword('aa'), false);
    assert.deepStrictEqual(pwd.checkPassword('aaaaaaaa'), false);
    assert.deepStrictEqual(pwd.checkPassword('Aaaaaaaa'), false);
    assert.deepStrictEqual(pwd.checkPassword('Aaaaaa3a'), false);
    assert.deepStrictEqual(pwd.checkPassword('Aaaaaa3!'), true);
  });
  should('Mask generator is reversible', () => {
    const entropy = sha256('hello world');
    // Inverse works
    for (const m of [
      '@Ss-ss-ss',
      '************',
      'AaAa+AaA11..@@@@',
      '1111111-11111-1111-11-1',
      '*1*AnSs@Nl',
    ]) {
      assert.deepStrictEqual(pwd.mask(m).inverse(pwd.mask(m).apply(entropy)), entropy);
    }
    assert.deepStrictEqual('*Tavy-qyjy-vemo', pwd.mask('@Ss-ss-ss').apply(entropy).password);
    // Adding more symbols to mask doesn't change previous
    assert.deepStrictEqual(
      '*Tavy-qyjy-vemo-pysu',
      pwd.mask('@Ss-ss-ss-ss').apply(entropy).password
    );
    assert.deepStrictEqual(
      'Mavysa-dobywi-nuwem2',
      pwd.mask('Sss-sss-ssc1').apply(entropy).password
    );
    assert.deepStrictEqual(
      'Mavmuq-xadgys-poqsa5',
      pwd.mask('Cvccvc-cvccvc-cvccv1').apply(entropy).password
    );
    assert.deepStrictEqual('mavysa', pwd.mask('cvcvcv').apply(entropy).password);
    assert.deepStrictEqual('Mav-muq-xad', pwd.mask('Cvc-cvc-cvc').apply(entropy).password);
  });
  should('Secure mask', () => {
    // Basic sanity check that masks looks like safari secure password
    const vectors = [
      'kudpoh-6zyvis-nozsyB',
      'vicmyn-5xatit-Wuwzol',
      'fyfdap-2fikUb-huvcyc',
      'Xejfaw-cobfy0-morvus',
      'vimpur-donjiB-3nilon',
      'zucnAl-8holem-mutmeg',
      'Dytxe8-zocwes-wasbin',
      '4lyqyJ-jyfvyk-bibmuv',
      'higqop-nanba7-Vommas',
      'zuJzig-0maraz-lizpyz',
    ];
    for (let i = 0; i < 10; i++) {
      const entropy = sha256(`hello world${i}`);
      assert.deepStrictEqual(pwd.secureMask.apply(entropy).password, vectors[i]);
      assert.deepStrictEqual(pwd.secureMask.inverse(pwd.secureMask.apply(entropy)), entropy);
    }
  });
  should('Estimates', () => {
    // Manually  sanity checked via zxcvbn && recalc
    assert.deepStrictEqual(pwd.mask('cvcvcv').estimate(), {
      score: 'somewhat guessable',
      guesses: {
        online_throttling: '24mo',
        online: '2d',
        slow: '2min 52sec',
        fast: '0 sec',
      },
      costs: {
        luks: 0.07594542723659733,
        filevault2: 0.011138662661367609,
        macos: 0.0010126056964879645,
        pbkdf2: 0,
      },
    });
    assert.deepStrictEqual(pwd.mask('Cvc-cvc-cvc').estimate(), {
      score: 'very unguessable',
      guesses: {
        online_throttling: 'centuries',
        online: '1y 168mo 10d',
        slow: '16d',
        fast: '1sec',
      },
      costs: {
        luks: 614.524069450437,
        filevault2: 92.51975727671234,
        macos: 13.733971061466262,
        pbkdf2: 4.620519793074582,
      },
    });
    assert.deepStrictEqual(pwd.mask('Cvccvc-cvccvc-cvccv1').estimate(), {
      score: 'very unguessable',
      guesses: {
        online_throttling: 'centuries',
        online: 'centuries',
        slow: 'centuries',
        fast: '10y 36mo 12d',
      },
      costs: {
        luks: 4247595638820.9043,
        filevault2: 639497561511.5747,
        macos: 94933262418.26974,
        pbkdf2: 31941100309.223465,
      },
    });
  });
});

import url from 'node:url';
if (import.meta.url === url.pathToFileURL(process.argv[1]).href) {
  should.run();
}
