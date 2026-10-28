/**
 * Face ID / Touch ID via a passkey (WebAuthn) plus the PRF extension. The PRF output is a 32-byte secret that the
 * authenticator only releases after user verification; the vault derives a key-encrypting key from it (HKDF), see
 * data/vault.ts. This file is only the browser I/O.
 *
 * Trust model: there is no server, so the assertion signature is NOT verified. Security does not come from proving who
 * signed, but from the PRF secret being unavailable without the authenticator and the user's face or fingerprint.
 * Without PRF support (iOS < 18, some browsers) Face ID cannot be used at all and nothing is added.
 */

type Bytes = Uint8Array<ArrayBuffer>

export const ERR_PASSKEY_UNSUPPORTED = 'Face ID wird auf diesem Gerät nicht unterstützt (benötigt iOS 18 oder neuer).'
export const ERR_PASSKEY_CANCELLED = 'Face ID wurde abgebrochen oder ist fehlgeschlagen.'

const randomBytes = (n: number): Bytes => crypto.getRandomValues(new Uint8Array(n))

export const newPrfSalt = (): Bytes => randomBytes(32)

/** Cheap guess before offering the button; whether PRF really works is only known after the first registration. */
export async function isPasskeyPrfLikelySupported(): Promise<boolean> {
  try {
    if (typeof PublicKeyCredential === 'undefined' || !navigator.credentials) return false
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
  } catch {
    return false
  }
}

function prfFirst(credential: PublicKeyCredential): Bytes | null {
  const results = credential.getClientExtensionResults() as { prf?: { results?: { first?: ArrayBuffer | ArrayBufferView } } }
  const first = results.prf?.results?.first
  if (!first) return null
  const bytes = ArrayBuffer.isView(first)
    ? new Uint8Array(first.buffer.slice(first.byteOffset, first.byteOffset + first.byteLength) as ArrayBuffer)
    : new Uint8Array(first.slice(0))
  return bytes.length === 32 ? bytes : null
}

/** Asks the authenticator (Face ID prompt) for the PRF secret of an existing credential. */
export async function getPrfOutput(credentialId: Uint8Array, prfSalt: Uint8Array): Promise<Bytes> {
  let credential: Credential | null
  try {
    credential = await navigator.credentials.get({
      publicKey: {
        challenge: randomBytes(32),
        allowCredentials: [{ type: 'public-key', id: credentialId as Bytes }],
        userVerification: 'required',
        extensions: { prf: { eval: { first: prfSalt as Bytes } } },
      } as PublicKeyCredentialRequestOptions,
    })
  } catch {
    throw new Error(ERR_PASSKEY_CANCELLED)
  }
  const output = credential ? prfFirst(credential as PublicKeyCredential) : null
  if (!output) throw new Error(ERR_PASSKEY_UNSUPPORTED)
  return output
}

/** Creates the passkey and returns its id plus the PRF secret (iOS often hands the secret out only on `get`). */
export async function registerPasskey(prfSalt: Uint8Array): Promise<{ credentialId: Bytes; prfOutput: Bytes }> {
  if (!(await isPasskeyPrfLikelySupported())) throw new Error(ERR_PASSKEY_UNSUPPORTED)
  let credential: Credential | null
  try {
    credential = await navigator.credentials.create({
      publicKey: {
        rp: { name: 'Finanzklar' }, // rp.id defaults to the current host
        user: { id: randomBytes(16), name: 'finanzklar', displayName: 'Finanzklar' },
        challenge: randomBytes(32),
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 },
          { type: 'public-key', alg: -257 },
        ],
        authenticatorSelection: { authenticatorAttachment: 'platform', residentKey: 'required', userVerification: 'required' },
        extensions: { prf: { eval: { first: prfSalt as Bytes } } },
      } as PublicKeyCredentialCreationOptions,
    })
  } catch {
    throw new Error(ERR_PASSKEY_CANCELLED)
  }
  if (!credential) throw new Error(ERR_PASSKEY_CANCELLED)
  const created = credential as PublicKeyCredential
  const credentialId = new Uint8Array(created.rawId.slice(0))
  const prf = (created.getClientExtensionResults() as { prf?: { enabled?: boolean } }).prf
  if (!prf) throw new Error(ERR_PASSKEY_UNSUPPORTED) // the extension is not known at all
  const prfOutput = prfFirst(created) ?? (await getPrfOutput(credentialId, prfSalt))
  return { credentialId, prfOutput }
}
