export interface SpeakeasySecret {
  ascii: string;
  hex: string;
  base32: string;
  otpauth_url?: string;
}

export interface SpeakeasyModule {
  generateSecret: (options: {
    name: string;
    issuer: string;
    length: number;
  }) => SpeakeasySecret;
  otpauthURL: (options: {
    secret: string;
    label: string;
    issuer: string;
  }) => string;
  totp: {
    verify: (options: {
      secret: string;
      token: string;
      window?: number;
      time?: number;
      encoding?: string;
    }) => boolean | { delta: number };
    (options: { secret: string; time?: number; encoding?: string }): string;
  };
}
