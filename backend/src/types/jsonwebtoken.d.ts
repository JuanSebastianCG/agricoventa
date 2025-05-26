declare module 'jsonwebtoken' {
  export interface JwtPayload {
    [key: string]: any;
  }

  // Define StringValue to match what the jsonwebtoken package expects
  export type StringValue = string | { toString(): string };

  export type Secret = string | Buffer | { key: string; passphrase: string };
  export type SignOptions = {
    algorithm?: string;
    expiresIn?: StringValue | number;
    notBefore?: StringValue | number;
    audience?: string | string[];
    issuer?: string;
    jwtid?: string;
    subject?: string;
    noTimestamp?: boolean;
    header?: object;
    encoding?: string;
    keyid?: string;
  };

  export function sign(
    payload: string | Buffer | object,
    secretOrPrivateKey: Secret,
    options?: SignOptions
  ): string;

  export function verify(
    token: string,
    secretOrPublicKey: Secret,
    options?: object
  ): JwtPayload | string;

  export function decode(
    token: string,
    options?: { complete?: boolean; json?: boolean }
  ): null | JwtPayload | string;
} 