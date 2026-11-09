export type ImageFileRules = {
  acceptedTypes: readonly string[];
  maxFileSize: number;
  /** How many more images fit */
  remainingSlots: number;
};

export type ImageFileCheck = {
  accepted: File[];
  errors: string[];
};

function toMegabytes(bytes: number) {
  return Math.round((bytes / (1024 * 1024)) * 10) / 10;
}

/** A first check for fast feedback. The API still verifies the real file content. */
export function checkImageFiles(
  files: readonly File[],
  { acceptedTypes, maxFileSize, remainingSlots }: ImageFileRules,
): ImageFileCheck {
  const accepted: File[] = [];
  const errors: string[] = [];

  for (const file of files) {
    if (!acceptedTypes.includes(file.type)) {
      errors.push(`${file.name}: nieobsługiwany format pliku`);
    } else if (file.size > maxFileSize) {
      errors.push(`${file.name}: plik jest większy niż ${toMegabytes(maxFileSize)} MB`);
    } else if (accepted.length >= remainingSlots) {
      errors.push(`${file.name}: osiągnięto limit zdjęć`);
    } else {
      accepted.push(file);
    }
  }

  return { accepted, errors };
}

/** Returns the items with the one at `from` moved to index `to`. */
export function moveItem<T>(items: readonly T[], from: number, to: number): T[] {
  const result = [...items];
  const [moved] = result.splice(from, 1);
  if (moved !== undefined) result.splice(to, 0, moved);
  return result;
}
