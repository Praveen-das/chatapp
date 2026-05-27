// Diagnose key parsing with different approaches
const crypto = require('crypto');

console.log('Node:', process.version, '| OpenSSL:', process.versions.openssl);

const keyB64 = process.env.KAFKA_SSL_KEY_B64;
const keyPem = Buffer.from(keyB64, 'base64').toString('utf-8').replace(/\r/g, '');
const keyBuf = Buffer.from(keyB64, 'base64');

// Show raw bytes around potential problem areas
console.log('\nKey length (base64):', keyB64.length);
console.log('Key length (decoded):', keyBuf.length);
console.log('First 80 chars of PEM:', JSON.stringify(keyPem.substring(0, 80)));
console.log('Last 60 chars of PEM:', JSON.stringify(keyPem.substring(keyPem.length - 60)));

// Attempt 1: string
try {
  crypto.createPrivateKey(keyPem);
  console.log('\n✅ Attempt 1 (string): OK');
} catch (e) {
  console.log('\n❌ Attempt 1 (string):', e.message);
}

// Attempt 2: Buffer
try {
  crypto.createPrivateKey(keyBuf);
  console.log('✅ Attempt 2 (buffer): OK');
} catch (e) {
  console.log('❌ Attempt 2 (buffer):', e.message);
}

// Attempt 3: explicit options
try {
  crypto.createPrivateKey({ key: keyPem, format: 'pem', type: 'pkcs8' });
  console.log('✅ Attempt 3 (explicit pkcs8): OK');
} catch (e) {
  console.log('❌ Attempt 3 (explicit pkcs8):', e.message);
}

// Attempt 4: DER from base64 content only (strip PEM headers)
try {
  const derB64 = keyPem.split('\n').filter(l => !l.startsWith('-----')).join('');
  const derBuf = Buffer.from(derB64, 'base64');
  console.log('DER buffer length:', derBuf.length);
  crypto.createPrivateKey({ key: derBuf, format: 'der', type: 'pkcs8' });
  console.log('✅ Attempt 4 (DER): OK');
} catch (e) {
  console.log('❌ Attempt 4 (DER):', e.message);
}
