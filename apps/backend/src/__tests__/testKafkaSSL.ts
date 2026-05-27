import crypto from "crypto";
import tls from "tls";
import dotenv from "dotenv";
import path from "path";

// Load env from project root
dotenv.config({ path: path.resolve(__dirname, "../../../../.env") });

const REQUIRED_ENV = ["KAFKA_SSL_CA_B64", "KAFKA_SSL_CERT_B64", "KAFKA_SSL_KEY_B64", "KAFKA_HOST"] as const;

function decodePem(b64: string): string {
  return Buffer.from(b64, "base64").toString("utf-8").replace(/\r/g, "");
}

function testKeyIntegrity(): void {
  console.log("🔑 Kafka SSL Key Integrity Test");
  console.log("================================\n");
  console.log(`Node: ${process.version} | OpenSSL: ${process.versions.openssl}\n`);

  // 1. Check env vars exist
  const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    console.error(`❌ Missing env vars: ${missing.join(", ")}`);
    process.exit(1);
  }
  console.log("✅ All required env vars present\n");

  const ca = decodePem(process.env.KAFKA_SSL_CA_B64!);
  const key = decodePem(process.env.KAFKA_SSL_KEY_B64!);
  const cert = decodePem(process.env.KAFKA_SSL_CERT_B64!);

  // 2. Validate PEM structure
  const pemChecks = [
    { name: "CA Certificate", pem: ca, beginTag: "BEGIN CERTIFICATE", endTag: "END CERTIFICATE" },
    { name: "Client Certificate", pem: cert, beginTag: "BEGIN CERTIFICATE", endTag: "END CERTIFICATE" },
    { name: "Private Key", pem: key, beginTag: "BEGIN PRIVATE KEY", endTag: "END PRIVATE KEY" },
  ] as const;

  let allValid = true;

  for (const { name, pem, beginTag, endTag } of pemChecks) {
    const hasBegin = pem.includes(`-----${beginTag}-----`);
    const hasEnd = pem.includes(`-----${endTag}-----`);

    const bodyLines = pem.split("\n").filter((l) => !l.startsWith("-----") && l.trim().length > 0);
    const invalidChars: Array<{ line: number; char: string; code: number }> = [];
    for (let i = 0; i < bodyLines.length; i++) {
      for (const c of bodyLines[i]!) {
        if (!/[A-Za-z0-9+/=]/.test(c)) {
          invalidChars.push({ line: i, char: c, code: c.charCodeAt(0) });
        }
      }
    }

    if (!hasBegin || !hasEnd) {
      console.error(`❌ ${name}: Missing PEM headers`);
      allValid = false;
    } else if (invalidChars.length > 0) {
      console.error(`❌ ${name}: Invalid characters in PEM body:`);
      for (const ic of invalidChars) {
        console.error(`   Line ${ic.line}: char '${ic.char}' (0x${ic.code.toString(16)})`);
      }
      allValid = false;
    } else {
      console.log(`✅ ${name}: PEM structure valid`);
    }
  }

  if (!allValid) {
    console.error("\n❌ PEM validation failed. Re-download keys from Aiven.");
    process.exit(1);
  }

  // 3. Parse with Node crypto
  console.log("");

  try {
    const x509Ca = new crypto.X509Certificate(ca);
    console.log(`✅ CA parsed: ${x509Ca.subject}`);
  } catch (e: unknown) {
    console.error(`❌ CA parse failed: ${e instanceof Error ? e.message : String(e)}`);
    allValid = false;
  }

  try {
    const x509Cert = new crypto.X509Certificate(cert);
    console.log(`✅ Client cert parsed: ${x509Cert.subject}`);
  } catch (e: unknown) {
    console.error(`❌ Client cert parse failed: ${e instanceof Error ? e.message : String(e)}`);
    allValid = false;
  }

  try {
    const privKey = crypto.createPrivateKey(key);
    console.log(`✅ Private key parsed: ${privKey.asymmetricKeyType}`);
  } catch (e: unknown) {
    console.error(`❌ Private key parse failed: ${e instanceof Error ? e.message : String(e)}`);
    allValid = false;
  }

  if (!allValid) {
    console.error("\n❌ Crypto parsing failed. Keys may be corrupted.");
    process.exit(1);
  }

  // 4. Verify cert/key pair match
  try {
    const pubFromCert = crypto.createPublicKey(cert);
    const pubFromKey = crypto.createPublicKey(crypto.createPrivateKey(key));
    const certDer = Buffer.from(pubFromCert.export({ type: "spki", format: "der" }));
    const keyDer = Buffer.from(pubFromKey.export({ type: "spki", format: "der" }));

    if (certDer.equals(keyDer)) {
      console.log("✅ Certificate and private key match");
    } else {
      console.error("❌ Certificate and private key DO NOT match");
      allValid = false;
    }
  } catch (e: unknown) {
    console.error(`❌ Key pair verification failed: ${e instanceof Error ? e.message : String(e)}`);
    allValid = false;
  }

  if (!allValid) {
    process.exit(1);
  }

  // 5. Test TLS connection to Kafka broker
  const kafkaHost = process.env.KAFKA_HOST ?? "";
  const colonIdx = kafkaHost.lastIndexOf(":");
  const host = kafkaHost.substring(0, colonIdx);
  const port = parseInt(kafkaHost.substring(colonIdx + 1), 10);

  console.log(`\n🔌 Testing TLS connection to ${host}:${port}...\n`);

  const socket = tls.connect(
    { host, port, ca: [ca], key, cert, rejectUnauthorized: true },
    () => {
      console.log("✅ TLS handshake successful!");
      console.log(`   Protocol: ${socket.getProtocol()}`);
      console.log(`   Cipher: ${socket.getCipher().name}`);
      console.log("\n✅ All checks passed — Kafka SSL is ready.");
      socket.destroy();
      process.exit(0);
    }
  );

  socket.on("error", (err: Error) => {
    console.error(`❌ TLS connection failed: ${err.message}`);
    process.exit(1);
  });

  setTimeout(() => {
    console.error("❌ Connection timed out after 15s");
    socket.destroy();
    process.exit(1);
  }, 15000);
}

testKeyIntegrity();
