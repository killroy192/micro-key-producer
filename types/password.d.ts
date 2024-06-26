export declare function zip<A, B>(a: A[], b: B[]): [A, B][];
export declare function or<T>(...sets: Set<T>[]): Set<T>;
export declare function and<T>(...sets: Set<T>[]): Set<T>;
export declare function product(...sets: Set<string>[]): Set<string>;
export declare const DATE: Record<string, number>;
export declare function formatDuration(dur: number): string;
export declare const alphabet: Record<string, Set<string>>;
/**
 * Check if password is correct for rules in design rationale.
 */
export declare function checkPassword(pwd: string): boolean;
export declare function cardinalityBits(cardinality: bigint): number;
type ApplyResult = {
    password: string;
    entropyLeft: bigint;
};
declare class Mask {
    private chars;
    private sets;
    private lengths;
    readonly cardinality: bigint;
    readonly entropy: number;
    readonly length: number;
    constructor(mask: string);
    apply(entropy: Uint8Array): ApplyResult;
    inverse({ password, entropyLeft }: ApplyResult): Uint8Array;
    estimate(): {
        score: string;
        guesses: {
            online_throttling: string;
            online: string;
            slow: string;
            fast: string;
        };
        costs: {
            luks: number;
            filevault2: number;
            macos: number;
            pbkdf2: number;
        };
    };
}
export declare const mask: (mask: string) => Mask;
export type MaskType = {
    [K in keyof Mask]: Mask[K];
};
export declare const secureMask: MaskType;
export {};
//# sourceMappingURL=password.d.ts.map