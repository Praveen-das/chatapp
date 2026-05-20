// True End-to-End Encryption (E2EE) cryptographic layer using native Web Crypto API

export interface E2EKeyPair {
  publicKey: string; // JWK formatted public key string
  privateKey: string; // JWK formatted private key string
}

// Check if we are running in the browser (Next.js SSR safety)
const isBrowser = typeof window !== "undefined" && window.crypto && window.crypto.subtle;

/**
 * Generate a new ECDH P-256 key pair
 */
export async function generateE2EKeyPair(): Promise<E2EKeyPair> {
  if (!isBrowser) throw new Error("Cryptography is client-only");

  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: "ECDH",
      namedCurve: "P-256",
    },
    true, // extractable
    ["deriveKey", "deriveBits"]
  );

  const publicKeyJwk = await window.crypto.subtle.exportKey("jwk", keyPair.publicKey);
  const privateKeyJwk = await window.crypto.subtle.exportKey("jwk", keyPair.privateKey);

  return {
    publicKey: JSON.stringify(publicKeyJwk),
    privateKey: JSON.stringify(privateKeyJwk),
  };
}

/**
 * Derive a strong symmetric key from a user's Security PIN via PBKDF2
 */
async function deriveWrappingKey(pin: string, saltStr: string): Promise<CryptoKey> {
  if (!isBrowser) throw new Error("Cryptography is client-only");

  const encoder = new TextEncoder();
  const pinKeyMaterial = await window.crypto.subtle.importKey(
    "raw",
    encoder.encode(pin),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  const salt = encoder.encode(saltStr);

  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    pinKeyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

/**
 * Wrap (encrypt) the private key using a Security PIN for server backup
 */
export async function wrapPrivateKey(privateKeyJwkStr: string, pin: string, saltStr: string): Promise<string> {
  if (!isBrowser) throw new Error("Cryptography is client-only");

  const wrappingKey = await deriveWrappingKey(pin, saltStr);
  const encoder = new TextEncoder();
  const data = encoder.encode(privateKeyJwkStr);

  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const ciphertext = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
    },
    wrappingKey,
    data
  );

  const ivBase64 = btoa(String.fromCharCode(...iv));
  const ciphertextBase64 = btoa(String.fromCharCode(...new Uint8Array(ciphertext)));

  return `${ivBase64}:${ciphertextBase64}`;
}

/**
 * Unwrap (decrypt) the private key using a Security PIN retrieved from server
 */
export async function unwrapPrivateKey(wrappedKeyStr: string, pin: string, saltStr: string): Promise<string> {
  if (!isBrowser) throw new Error("Cryptography is client-only");

  const [ivBase64, ciphertextBase64] = wrappedKeyStr.split(":");
  if (!ivBase64 || !ciphertextBase64) {
    throw new Error("Invalid wrapped key format");
  }

  const wrappingKey = await deriveWrappingKey(pin, saltStr);

  const iv = new Uint8Array(atob(ivBase64).split("").map((c) => c.charCodeAt(0)));
  const ciphertext = new Uint8Array(atob(ciphertextBase64).split("").map((c) => c.charCodeAt(0)));

  const decrypted = await window.crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv,
    },
    wrappingKey,
    ciphertext
  );

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

/**
 * Derive the AES-GCM symmetric key from self private key and other's public key
 */
async function deriveSharedKey(myPrivateKeyJwkStr: string, otherPublicKeyJwkStr: string): Promise<CryptoKey> {
  if (!isBrowser) throw new Error("Cryptography is client-only");

  const myPrivateKey = await window.crypto.subtle.importKey(
    "jwk",
    JSON.parse(myPrivateKeyJwkStr),
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveKey"]
  );

  const otherPublicKey = await window.crypto.subtle.importKey(
    "jwk",
    JSON.parse(otherPublicKeyJwkStr),
    { name: "ECDH", namedCurve: "P-256" },
    true,
    []
  );

  return window.crypto.subtle.deriveKey(
    {
      name: "ECDH",
      public: otherPublicKey,
    },
    myPrivateKey,
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypt a text message for a recipient using ECDH + AES-GCM
 */
export async function encryptMessage(
  message: string,
  otherPublicKeyJwkStr: string,
  myPrivateKeyJwkStr: string
): Promise<string> {
  if (!isBrowser) return message;
  if (!otherPublicKeyJwkStr || !myPrivateKeyJwkStr) {
    return message; // fallback to plain if key is missing (e.g. initial setup)
  }

  try {
    const sharedKey = await deriveSharedKey(myPrivateKeyJwkStr, otherPublicKeyJwkStr);
    const encoder = new TextEncoder();
    const data = encoder.encode(message);

    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    const ciphertext = await window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv,
      },
      sharedKey,
      data
    );

    const ivBase64 = btoa(String.fromCharCode(...iv));
    const ciphertextBase64 = btoa(String.fromCharCode(...new Uint8Array(ciphertext)));

    return `v2:${ivBase64}:${ciphertextBase64}`;
  } catch (error) {
    console.error("Encryption failed:", error);
    return message;
  }
}

/**
 * Decrypt a ciphertext message using ECDH + AES-GCM
 */
export async function decryptMessage(
  encryptedMessage: string,
  otherPublicKeyJwkStr?: string,
  myPrivateKeyJwkStr?: string
): Promise<string> {
  if (!isBrowser) return encryptedMessage;
  if (!encryptedMessage || !encryptedMessage.startsWith("v2:")) {
    // Drop old CryptoJS backward compatibility support per user directive.
    // If it's not starting with v2:, it's undecryptable or plain.
    return encryptedMessage;
  }

  if (!otherPublicKeyJwkStr || !myPrivateKeyJwkStr) {
    return "[Secure E2EE message - decrypt key missing]";
  }

  try {
    const [, ivBase64, ciphertextBase64] = encryptedMessage.split(":");
    if (!ivBase64 || !ciphertextBase64) {
      return "[Secure message - corrupted format]";
    }

    const sharedKey = await deriveSharedKey(myPrivateKeyJwkStr, otherPublicKeyJwkStr);

    const iv = new Uint8Array(atob(ivBase64).split("").map((c) => c.charCodeAt(0)));
    const ciphertext = new Uint8Array(atob(ciphertextBase64).split("").map((c) => c.charCodeAt(0)));

    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv,
      },
      sharedKey,
      ciphertext
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error("Decryption failed:", error);
    return "[Secure message - decryption failed]";
  }
}