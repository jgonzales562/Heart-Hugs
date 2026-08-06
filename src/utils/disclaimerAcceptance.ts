export type DisclaimerAcceptance = {
  acceptedAt: string;
  version: string;
};

export function createDisclaimerAcceptance(
  version: string,
  acceptedAt = new Date()
): DisclaimerAcceptance {
  return {
    acceptedAt: acceptedAt.toISOString(),
    version,
  };
}

export function serializeDisclaimerAcceptance(acceptance: DisclaimerAcceptance) {
  return JSON.stringify(acceptance);
}

export function hasAcceptedDisclaimerVersion(rawValue: string | null, currentVersion: string) {
  if (isLegacyDisclaimerAcceptance(rawValue)) {
    return true;
  }

  if (!rawValue) {
    return false;
  }

  try {
    const parsedValue: unknown = JSON.parse(rawValue);

    if (!isDisclaimerAcceptance(parsedValue)) {
      return false;
    }

    return parsedValue.version === currentVersion;
  } catch {
    return false;
  }
}

export function isLegacyDisclaimerAcceptance(rawValue: string | null) {
  return rawValue === 'true';
}

function isDisclaimerAcceptance(value: unknown): value is DisclaimerAcceptance {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const acceptance = value as Partial<DisclaimerAcceptance>;

  return (
    typeof acceptance.version === 'string' &&
    typeof acceptance.acceptedAt === 'string' &&
    !Number.isNaN(Date.parse(acceptance.acceptedAt))
  );
}
