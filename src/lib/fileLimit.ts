/** Import files larger than this are rejected before they are read into memory (same limit as the xlsx importer). */
export const MAX_FILE_BYTES = 10 * 1024 * 1024
export const ERR_TOO_BIG = 'Die Datei ist zu groß (höchstens 10 MB).'
