export type NukeFormValues = {
  remove?: boolean;
  lock?: boolean;
  skipDistinguished?: boolean;
  targetId?: string;
};

export type NormalizedNukeFormValues = {
  remove: boolean;
  lock: boolean;
  skipDistinguished: boolean;
};

export function normalizeNukeFormValues(
  values: NukeFormValues
): NormalizedNukeFormValues {
  return {
    remove: Boolean(values.remove),
    lock: Boolean(values.lock),
    skipDistinguished: Boolean(values.skipDistinguished),
  };
}

export function hasNukeAction(values: NormalizedNukeFormValues): boolean {
  return values.remove || values.lock;
}

export function getSubmittedTargetId(
  values: NukeFormValues,
  fallbackTargetId: string | undefined
): string | undefined {
  if (typeof values.targetId === 'string' && values.targetId.trim()) {
    return values.targetId.trim();
  }

  return fallbackTargetId;
}
