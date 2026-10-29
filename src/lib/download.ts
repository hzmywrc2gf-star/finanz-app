/** Hands a file to the browser's download (works in the installed PWA too). */
export function downloadFile(fileName: string, content: BlobPart, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** Hands a JSON text file (backup) to the browser's download. */
export function downloadTextFile(fileName: string, text: string): void {
  downloadFile(fileName, text, 'application/json')
}
