const textEncoder = new TextEncoder();

const BASE64_ALPHABET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function toUint8Array(data: ArrayBuffer | Uint8Array): Uint8Array {
  return data instanceof Uint8Array ? data : new Uint8Array(data);
}

function encodeBase64(bytes: Uint8Array): string {
  let output = '';

  for (let index = 0; index < bytes.length; index += 3) {
    const first = bytes[index] ?? 0;
    const second = bytes[index + 1] ?? 0;
    const third = bytes[index + 2] ?? 0;
    const chunk = (first << 16) | (second << 8) | third;
    const remaining = bytes.length - index;

    output += BASE64_ALPHABET[(chunk >> 18) & 63];
    output += BASE64_ALPHABET[(chunk >> 12) & 63];
    output += remaining > 1 ? BASE64_ALPHABET[(chunk >> 6) & 63] : '=';
    output += remaining > 2 ? BASE64_ALPHABET[chunk & 63] : '=';
  }

  return output;
}

function decodeBase64(input: string): Uint8Array {
  const normalized = input.replace(/\s+/g, '');
  if (!normalized) {
    return new Uint8Array();
  }

  const padded =
    normalized.length % 4 === 0
      ? normalized
      : `${normalized}${'='.repeat(4 - (normalized.length % 4))}`;
  const output: number[] = [];

  for (let index = 0; index < padded.length; index += 4) {
    const first = padded[index];
    const second = padded[index + 1];
    const third = padded[index + 2];
    const fourth = padded[index + 3];

    if (!first || !second || !third || !fourth) {
      throw new Error('invalid_base64');
    }

    const firstValue = BASE64_ALPHABET.indexOf(first);
    const secondValue = BASE64_ALPHABET.indexOf(second);
    const thirdValue = third === '=' ? 0 : BASE64_ALPHABET.indexOf(third);
    const fourthValue = fourth === '=' ? 0 : BASE64_ALPHABET.indexOf(fourth);

    if (
      firstValue < 0 ||
      secondValue < 0 ||
      (third !== '=' && thirdValue < 0) ||
      (fourth !== '=' && fourthValue < 0)
    ) {
      throw new Error('invalid_base64');
    }

    const chunk =
      (firstValue << 18) |
      (secondValue << 12) |
      (thirdValue << 6) |
      fourthValue;

    output.push((chunk >> 16) & 255);
    if (third !== '=') {
      output.push((chunk >> 8) & 255);
    }
    if (fourth !== '=') {
      output.push(chunk & 255);
    }
  }

  return new Uint8Array(output);
}

function toBase64Url(base64: string): string {
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(base64Url: string): string {
  return base64Url.replace(/-/g, '+').replace(/_/g, '/');
}

function bytesToHex(bytes: Uint8Array): string {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function normalizePem(pem: string): string {
  return pem
    .replace(/\\n/g, '\n')
    .replace(/-----BEGIN [^-]+-----/g, '')
    .replace(/-----END [^-]+-----/g, '')
    .replace(/\s+/g, '');
}

function toOwnedArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}

function pemToBytes(pem: string): ArrayBuffer {
  return toOwnedArrayBuffer(decodeBase64(normalizePem(pem)));
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    textEncoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    textEncoder.encode(value)
  );
  return bytesToHex(new Uint8Array(digest));
}

export async function sha256HexPrefix(
  value: string,
  length: number
): Promise<string> {
  return (await sha256Hex(value)).slice(0, length);
}

export function encodeBase64Url(
  input: string | ArrayBuffer | Uint8Array
): string {
  const bytes =
    typeof input === 'string' ? textEncoder.encode(input) : toUint8Array(input);
  return toBase64Url(encodeBase64(bytes));
}

export function decodeBase64Url(base64Url: string): Uint8Array {
  return decodeBase64(fromBase64Url(base64Url));
}

export async function signHmacSha256Base64Url(params: {
  payload: string;
  secret: string;
}): Promise<string> {
  const key = await importHmacKey(params.secret);
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    textEncoder.encode(params.payload)
  );
  return encodeBase64Url(signature);
}

export async function verifyHmacSha256Base64Url(params: {
  payload: string;
  secret: string;
  signature: string;
}): Promise<boolean> {
  let signatureBytes: Uint8Array;
  try {
    signatureBytes = decodeBase64Url(params.signature);
  } catch {
    return false;
  }

  const key = await importHmacKey(params.secret);
  return crypto.subtle.verify(
    'HMAC',
    key,
    toOwnedArrayBuffer(signatureBytes),
    textEncoder.encode(params.payload)
  );
}

export async function signEs256Pkcs8(params: {
  payload: string;
  privateKeyPem: string;
}): Promise<string> {
  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    pemToBytes(params.privateKeyPem),
    {
      name: 'ECDSA',
      namedCurve: 'P-256',
    },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign(
    {
      name: 'ECDSA',
      hash: 'SHA-256',
    },
    privateKey,
    textEncoder.encode(params.payload)
  );
  return encodeBase64Url(signature);
}
