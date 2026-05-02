import { safeStorage } from "electron";
import { readFile, writeFile } from "node:fs/promises";

type SecurePayload = {
  nodeToken: string | null;
  sessionToken: string | null;
};

export class SecureStore {
  constructor(private readonly filePath: string) {}

  async getNodeToken(): Promise<string | null> {
    const payload = await this.readPayload();
    return payload.nodeToken;
  }

  async getSessionToken(): Promise<string | null> {
    const payload = await this.readPayload();
    return payload.sessionToken;
  }

  async setNodeToken(token: string): Promise<void> {
    const payload = await this.readPayload();
    await this.writePayload({
      ...payload,
      nodeToken: token,
    });
  }

  async setSessionToken(token: string | null): Promise<void> {
    const payload = await this.readPayload();
    await this.writePayload({
      ...payload,
      sessionToken: token?.trim() || null,
    });
  }

  private async readPayload(): Promise<SecurePayload> {
    try {
      const raw = await readFile(this.filePath, "utf8");
      const stored = JSON.parse(raw) as { encrypted: boolean; value: string | null };
      if (!stored.value) {
        return { nodeToken: null, sessionToken: null };
      }

      if (!stored.encrypted) {
        return parseStoredValue(stored.value);
      }

      if (!safeStorage.isEncryptionAvailable()) {
        return { nodeToken: null, sessionToken: null };
      }

      const decrypted = safeStorage.decryptString(Buffer.from(stored.value, "base64"));
      return parseStoredValue(decrypted);
    } catch {
      return { nodeToken: null, sessionToken: null };
    }
  }

  private async writePayload(payload: SecurePayload): Promise<void> {
    if (!payload.nodeToken && !payload.sessionToken) {
      await writeFile(
        this.filePath,
        JSON.stringify({ encrypted: false, value: null }, null, 2),
        "utf8",
      );
      return;
    }

    const serialized = JSON.stringify(payload);

    if (!safeStorage.isEncryptionAvailable()) {
      await writeFile(
        this.filePath,
        JSON.stringify({ encrypted: false, value: serialized }, null, 2),
        "utf8",
      );
      return;
    }

    const encrypted = safeStorage.encryptString(serialized).toString("base64");
    await writeFile(
      this.filePath,
      JSON.stringify({ encrypted: true, value: encrypted }, null, 2),
      "utf8",
    );
  }
}

function parseStoredValue(value: string): SecurePayload {
  try {
    const parsed = JSON.parse(value) as Partial<SecurePayload>;
    return {
      nodeToken: parsed.nodeToken?.trim() || null,
      sessionToken: parsed.sessionToken?.trim() || null,
    };
  } catch {
    return {
      nodeToken: value.trim() || null,
      sessionToken: null,
    };
  }
}
