import { createPrivateKey, sign } from "node:crypto";

import {
  createSiwxChallenge,
  getWalletDisplayName,
  getWalletExternalId,
  verifySiwxChallenge,
} from "../../lib/boreal/one-request/auth.ts";

export type SmokeWalletFixtureKey =
  | "collective-buyer"
  | "collective-collaborator"
  | "collective-lead"
  | "one-inbox-buyer"
  | "one-inbox-supplier"
  | "payouts-buyer"
  | "payouts-supplier"
  | "supplier-capacity-buyer"
  | "supplier-capacity-supplier"
  | "supplier-onboarding-buyer"
  | "supplier-onboarding-supplier"
  | "webhooks-buyer"
  | "webhooks-supplier";

const FIXTURES: Record<
  SmokeWalletFixtureKey,
  {
    privateKeyPem: string;
    walletAddress: string;
  }
> = {
  "one-inbox-buyer": {
    privateKeyPem:
      "-----BEGIN PRIVATE KEY-----\nMC4CAQAwBQYDK2VwBCIEIGTM156LgkazdvLvPUVyL6F3jTKsRuEXpmbw6YjWEKGp\n-----END PRIVATE KEY-----\n",
    walletAddress: "G1Gg2BrcQAjuBaAV5tDBkyzDNDuXnMJTvUJWRrMk383C",
  },
  "one-inbox-supplier": {
    privateKeyPem:
      "-----BEGIN PRIVATE KEY-----\nMC4CAQAwBQYDK2VwBCIEIGSb9qVcWkgHuXmvhhTDjUyqdizRdrhSOPeLplgWSijJ\n-----END PRIVATE KEY-----\n",
    walletAddress: "6ZaGX6G8kQwcXETDwvs3YeqgYf2af6W25f6G7ab8gLb2",
  },
  "payouts-buyer": {
    privateKeyPem:
      "-----BEGIN PRIVATE KEY-----\nMC4CAQAwBQYDK2VwBCIEIKBQjsoUsQqzfbGJp0LCjazuoNbLr7ZKdMxRZbDDUQv+\n-----END PRIVATE KEY-----\n",
    walletAddress: "EkseRMhpB3D67ENRh2zeibcmn3ZKkeB83qrcAJf9Me3",
  },
  "payouts-supplier": {
    privateKeyPem:
      "-----BEGIN PRIVATE KEY-----\nMC4CAQAwBQYDK2VwBCIEIKwiYY5GiEWAho9K1gtpy0BE1spg9+qEaVYH0Zgdu7xX\n-----END PRIVATE KEY-----\n",
    walletAddress: "43WGBnCS3zqtkCbHsgESfGqELPfwFS2D8kVtYm5KQyqk",
  },
  "supplier-onboarding-buyer": {
    privateKeyPem:
      "-----BEGIN PRIVATE KEY-----\nMC4CAQAwBQYDK2VwBCIEILtnlKDLTmdfwMoJscIzroizjwyRJEeYPOqJ8YvoOR6e\n-----END PRIVATE KEY-----\n",
    walletAddress: "Fpnib9QXFJMEkbAvMyYi5FWS1R9gH2vnEVyzhpSDQCVF",
  },
  "supplier-onboarding-supplier": {
    privateKeyPem:
      "-----BEGIN PRIVATE KEY-----\nMC4CAQAwBQYDK2VwBCIEINWf7RdR+RdfV7w7jvj8bGOrE0o3a5CqdsmKt6IuRO3d\n-----END PRIVATE KEY-----\n",
    walletAddress: "9ykNJRzYszN8xdKBhhLo59qPZadMTuQgBtF6aTnDs1w4",
  },
  "supplier-capacity-buyer": {
    privateKeyPem:
      "-----BEGIN PRIVATE KEY-----\nMC4CAQAwBQYDK2VwBCIEILkhA3L+0dhxLJoX41hF9hMm1H4fRaJQV/JepGTSZcKV\n-----END PRIVATE KEY-----\n",
    walletAddress: "63msP1YMAFp51sPBvMnL3qKpPKHDRiRpwjUWHRj2WHTQ",
  },
  "supplier-capacity-supplier": {
    privateKeyPem:
      "-----BEGIN PRIVATE KEY-----\nMC4CAQAwBQYDK2VwBCIEIGJjk4DJySVYSGWtVfB/moHe2HOA4mpbK/Ktg/LiU1W4\n-----END PRIVATE KEY-----\n",
    walletAddress: "9UEHGUjKVAUL7N1Um7UuPp6n9hbdYRMYtDLmKXtxLfGw",
  },
  "collective-buyer": {
    privateKeyPem:
      "-----BEGIN PRIVATE KEY-----\nMC4CAQAwBQYDK2VwBCIEIB5Cc2ignl44a89Y6r2NlZCkL8T91iNQG2JIUqE/8lrn\n-----END PRIVATE KEY-----\n",
    walletAddress: "BuqKMcB8jAHUGc2KFQ26A1LCGzMnXp6A7SRtvrEHa3F2",
  },
  "collective-lead": {
    privateKeyPem:
      "-----BEGIN PRIVATE KEY-----\nMC4CAQAwBQYDK2VwBCIEIPkICcl3cJzLdtlCREB+RGz0PCfu4Ma9tS1sSlS945jH\n-----END PRIVATE KEY-----\n",
    walletAddress: "22od73UxzdeXuQvywYSWbLbPcEeuJn6cKVea2RwMEyZg",
  },
  "collective-collaborator": {
    privateKeyPem:
      "-----BEGIN PRIVATE KEY-----\nMC4CAQAwBQYDK2VwBCIEIMmp+GJblaml5RWn0+tzlFhTc3uhgH/ORk+xbljhnOku\n-----END PRIVATE KEY-----\n",
    walletAddress: "Hcyi9FxcHmB4iuaBBrEmspx8spfdo15KXsgfNjGanbD3",
  },
  "webhooks-buyer": {
    privateKeyPem:
      "-----BEGIN PRIVATE KEY-----\nMC4CAQAwBQYDK2VwBCIEINvMVJ4AV0uPBZppf8FVhKSZupuwKAyQvuu0Vp/uCaA7\n-----END PRIVATE KEY-----\n",
    walletAddress: "8n7vGG4quJkLchjiY1MAJuRWBkkDuXt2brTYdrVEt9sy",
  },
  "webhooks-supplier": {
    privateKeyPem:
      "-----BEGIN PRIVATE KEY-----\nMC4CAQAwBQYDK2VwBCIEIL5/RUtk/zr8RyKO/nJyLrgCflZdFFhL+Z/zCrfBKGiz\n-----END PRIVATE KEY-----\n",
    walletAddress: "CodnUhYaE8pfvBsMgQbU69fViSWPmzXb93eefifCLnXU",
  },
};

export function createSmokeWalletIdentity(
  fixtureKey: SmokeWalletFixtureKey,
  label: string,
) {
  const fixture = FIXTURES[fixtureKey];
  const privateKey = createPrivateKey(fixture.privateKeyPem);
  const challenge = createSiwxChallenge({
    walletAddress: fixture.walletAddress,
  });
  const signature = sign(
    null,
    Buffer.from(challenge.message, "utf8"),
    privateKey,
  ).toString("hex");
  const verified = verifySiwxChallenge({
    challengeToken: challenge.challengeToken,
    signature,
    walletAddress: fixture.walletAddress,
  });

  return {
    displayName: `${label}-${getWalletDisplayName(fixture.walletAddress)}`,
    externalId: getWalletExternalId(fixture.walletAddress),
    sessionToken: verified.sessionToken,
    walletAddress: fixture.walletAddress,
  };
}
