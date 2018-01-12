/*
* Copyright 2018 PoC-Consortium
*/

let BN = require('bn.js');

/*
* BurstAddress class
*
* The BurstAdress class procides static methods for encoding and decoding numeric ids.
* In addition, addresses can be checked for validity.
*/
export class BurstAddress {
    private static readonly initialCodeword = [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    private static readonly gexp: number[] = [1, 2, 4, 8, 16, 5, 10, 20, 13, 26, 17, 7, 14, 28, 29, 31, 27, 19, 3, 6, 12, 24, 21, 15, 30, 25, 23, 11, 22, 9, 18, 1];
    private static readonly glog: number[] = [0, 0, 1, 18, 2, 5, 19, 11, 3, 29, 6, 27, 20, 8, 12, 23, 4, 10, 30, 17, 7, 22, 28, 26, 21, 25, 9, 16, 13, 14, 24, 15];
    private static readonly cwmap: number[] = [3, 2, 1, 0, 7, 6, 5, 4, 13, 14, 15, 16, 12, 8, 9, 10, 11];
    private static readonly alphabet: string[] = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'.split('');
    private static readonly base32Length = 13;

    private static ginv(a) {
        return BurstAddress.gexp[31 - BurstAddress.glog[a]];
    }

    private static gmult(a, b) {
        if (a == 0 || b == 0) {
            return 0;
        }

        let idx = (BurstAddress.glog[a] + BurstAddress.glog[b]) % 31;

        return BurstAddress.gexp[idx];
    }

    public static encode(plain: string): string {
        let plainString10 = [],
            codeword = BurstAddress.initialCodeword,
            pos = 0;

        let plainString = new BN(plain).toString();
        let length = plainString.length;

        for (let i = 0; i < length; i++) {
            plainString10[i] = plainString.charCodeAt(i) - '0'.charCodeAt(0);
        }

        let digit32 = 0,
            newLength = 0;
        do // base 10 to base 32 conversion
        {
            digit32 = 0;
            newLength = 0;
            for (let i = 0; i < length; i++) {
                digit32 = digit32 * 10 + plainString10[i];
                if (digit32 >= 32) {
                    plainString10[newLength] = digit32 >> 5;
                    digit32 &= 31;
                    newLength++;
                } else if (newLength > 0) {
                    plainString10[newLength] = 0;
                    newLength++;
                }
            }

            length = newLength;
            codeword[pos] = digit32;
            pos++;
        }
        while (length > 0);

        let p = [0, 0, 0, 0];

        for (let i = BurstAddress.base32Length - 1; i >= 0; i--) {
            let fb = codeword[i] ^ p[3];

            p[3] = p[2] ^ BurstAddress.gmult(30, fb);
            p[2] = p[1] ^ BurstAddress.gmult(6, fb);
            p[1] = p[0] ^ BurstAddress.gmult(9, fb);
            p[0] = BurstAddress.gmult(17, fb);
        }

        codeword[13] = p[0];
        codeword[14] = p[1];
        codeword[15] = p[2];
        codeword[16] = p[3];

        let out = 'BURST-';

        for (let i = 0; i < 17; i++) {
            out += BurstAddress.alphabet[codeword[BurstAddress.cwmap[i]]];

            if ((i & 3) == 3 && i < 13) out += '-';
        }

        return out;
    }


    public static decode(address: string): string {
        // remove Burst prefix
        if (address.indexOf('BURST-') == 0) {
            address = address.substr(6);
        } else {
            return undefined;
        }

        let codeword = BurstAddress.initialCodeword,
            codewordLength = 0;

        for (let i = 0; i < address.length; i++) {
            let pos = BurstAddress.alphabet.indexOf(address.charAt(i));

            if (pos <= -1 || pos > BurstAddress.alphabet.length) {
                continue;
            }

            if (codewordLength > 16) {
                return undefined;
            }

            let codeworkIndex = BurstAddress.cwmap[codewordLength];
            codeword[codeworkIndex] = pos;
            codewordLength++;
        }

        if (!BurstAddress.isValid(address)) {
            return undefined;
        }

        let length = BurstAddress.base32Length;
        let cypherString32 = [];
        for (let i = 0; i < length; i++) {
            cypherString32[i] = codeword[length - i - 1];
        }

        let out: string = "",
            newLength,
            digit10 = 0
        do { // base 32 to base 10 conversion
            newLength = 0;
            digit10 = 0;

            for (let i = 0; i < length; i++) {
                digit10 = digit10 * 32 + cypherString32[i];

                if (digit10 >= 10) {
                    cypherString32[newLength] = Math.floor(digit10 / 10);
                    digit10 %= 10;
                    newLength += 1;
                } else if (newLength > 0) {
                    cypherString32[newLength] = 0;
                    newLength += 1;
                }
            }
            length = newLength;
            out += digit10;
        } while (length > 0);

        return new BN(out.split("").reverse().join("")).toString();
    }

    public static isValid(address: string) {
        if (address.indexOf('BURST-') == 0) {
            address = address.substr(6);
        }

        let codeword = BurstAddress.initialCodeword,
            codewordLength = 0;

        for (let i = 0; i < address.length; i++) {
            let pos = BurstAddress.alphabet.indexOf(address.charAt(i));

            if (pos <= -1 || pos > BurstAddress.alphabet.length) {
                continue;
            }

            if (codewordLength > 16) {
                return false;
            }

            let codeworkIndex = BurstAddress.cwmap[codewordLength];
            codeword[codeworkIndex] = pos;
            codewordLength++;
        }

        if (codewordLength != 17) {
            return false;
        }

        let sum = 0;

        for (let i = 1; i < 5; i++) {
            let t = 0;

            for (let j = 0; j < 31; j++) {
                if (j > 12 && j < 27) {
                    continue;
                }

                let pos = j;
                if (j > 26) {
                    pos -= 14;
                }

                t ^= BurstAddress.gmult(codeword[pos], BurstAddress.gexp[(i * j) % 31]);
            }

            sum |= t;
        }

        return (sum == 0);
    }
}
