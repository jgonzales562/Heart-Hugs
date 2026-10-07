export type DisclaimerAcceptance = {
  readonly acceptedAt: string;
  readonly version: string;
};

export function createDisclaimerAcceptance(
  version: string,
  acceptedAt = new Date()
): DisclaimerAcceptance {
  if (!isValidVersion(version)) {
    throw new TypeError('Disclaimer version must not be blank.');
  }

  return {
    acceptedAt: acceptedAt.toISOString(),
    version,
  };
}

export function serializeDisclaimerAcceptance(acceptance: DisclaimerAcceptance): string {
  return JSON.stringify(acceptance);
}

export function hasAcceptedDisclaimerVersion(
  rawValue: string | null,
  currentVersion: string
): boolean {
  if (!isValidVersion(currentVersion)) {
    return false;
  }

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

export function isLegacyDisclaimerAcceptance(rawValue: string | null): boolean {
  return rawValue === 'true';
}

function isDisclaimerAcceptance(value: unknown): value is DisclaimerAcceptance {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const acceptance = value as Partial<DisclaimerAcceptance>;

  return (
    isValidVersion(acceptance.version) &&
    typeof acceptance.acceptedAt === 'string' &&
    isCanonicalIsoTimestamp(acceptance.acceptedAt)
  );
}

function isValidVersion(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isCanonicalIsoTimestamp(value: string): boolean {
  const parsedDate = new Date(value);

  return !Number.isNaN(parsedDate.getTime()) && parsedDate.toISOString() === value;
}
