const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DDMMYYYY_RE = /^(\d{2})\/(\d{2})\/(\d{4})$/;

/**
 * Convert a user-entered DOB string into ISO `YYYY-MM-DD` for the API.
 * Returns `''` for unrecognized input so the field can be omitted from the
 * request, avoiding the backend's "Malformed or missing request body" 400.
 */
export const toIsoDateOrEmpty = (raw: string): string => {
  const trimmed = (raw ?? '').trim();
  if (!trimmed) return '';
  if (ISO_DATE_RE.test(trimmed)) return trimmed;
  const dmy = trimmed.match(DDMMYYYY_RE);
  if (dmy) return `${dmy[3]}-${dmy[2]}-${dmy[1]}`;
  return '';
};
