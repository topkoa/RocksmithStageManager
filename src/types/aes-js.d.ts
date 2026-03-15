declare module 'aes-js' {
  namespace ModeOfOperation {
    class cfb {
      constructor(key: number[], iv: number[], segmentSize?: number);
      decrypt(data: Uint8Array): Uint8Array;
      encrypt(data: Uint8Array): Uint8Array;
    }
  }
  export default { ModeOfOperation };
}
