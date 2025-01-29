declare module 'qrcode-terminal' {
  function generate(qr: string, options: { small: boolean }, callback: (qrcode: string) => void): void;
  function generate(qr: string, options?: { small: boolean }): void;
}