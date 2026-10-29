/** Tiny XML reader for the .xlsx parts (no DOMParser, so it also runs in tests and workers). Namespace prefixes are dropped. */

export interface XmlNode {
  name: string
  attrs: Record<string, string>
  children: XmlNode[]
  /** The element's own text (all direct text pieces joined). */
  text: string
}

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" }

export function decodeEntities(s: string): string {
  if (!s.includes('&') && !s.includes('_x')) return s
  return s
    .replace(/&(#x[0-9a-fA-F]+|#\d+|\w+);/g, (m, e: string) => {
      if (e[0] === '#') {
        const code = e[1] === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10)
        return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : ''
      }
      return ENTITIES[e] ?? m
    })
    .replace(/_x([0-9a-fA-F]{4})_/g, (_m, h: string) => String.fromCharCode(parseInt(h, 16)))
}

const local = (name: string) => name.slice(name.indexOf(':') + 1)

export function parseXml(xml: string): XmlNode {
  const root: XmlNode = { name: '#root', attrs: {}, children: [], text: '' }
  const stack: XmlNode[] = [root]
  let i = 0
  const n = xml.length
  while (i < n) {
    const lt = xml.indexOf('<', i)
    if (lt < 0) break
    if (lt > i) stack[stack.length - 1].text += decodeEntities(xml.slice(i, lt))
    if (xml.startsWith('<!--', lt)) {
      const end = xml.indexOf('-->', lt + 4)
      i = end < 0 ? n : end + 3
    } else if (xml.startsWith('<![CDATA[', lt)) {
      const end = xml.indexOf(']]>', lt + 9)
      stack[stack.length - 1].text += xml.slice(lt + 9, end < 0 ? n : end)
      i = end < 0 ? n : end + 3
    } else if (xml[lt + 1] === '?' || xml[lt + 1] === '!') {
      const end = xml.indexOf('>', lt + 2)
      i = end < 0 ? n : end + 1
    } else if (xml[lt + 1] === '/') {
      const end = xml.indexOf('>', lt + 2)
      if (stack.length > 1) stack.pop()
      i = end < 0 ? n : end + 1
    } else {
      // start tag: read up to the closing '>' while honouring quoted attribute values
      let j = lt + 1
      let quote = ''
      while (j < n) {
        const ch = xml[j]
        if (quote) {
          if (ch === quote) quote = ''
        } else if (ch === '"' || ch === "'") quote = ch
        else if (ch === '>') break
        j++
      }
      const selfClosing = xml[j - 1] === '/'
      const inner = xml.slice(lt + 1, selfClosing ? j - 1 : j)
      const nameEnd = inner.search(/\s/)
      const rawName = nameEnd < 0 ? inner : inner.slice(0, nameEnd)
      const attrs: Record<string, string> = {}
      if (nameEnd >= 0) {
        const re = /([^\s=]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g
        const rest = inner.slice(nameEnd)
        let m: RegExpExecArray | null
        while ((m = re.exec(rest))) attrs[local(m[1])] = decodeEntities(m[2] ?? m[3] ?? '')
      }
      const node: XmlNode = { name: local(rawName), attrs, children: [], text: '' }
      stack[stack.length - 1].children.push(node)
      if (!selfClosing) stack.push(node)
      i = j + 1
    }
  }
  return root.children[0] ?? root
}

export function child(node: XmlNode, name: string): XmlNode | undefined {
  return node.children.find((c) => c.name === name)
}

export function childrenNamed(node: XmlNode, name: string): XmlNode[] {
  return node.children.filter((c) => c.name === name)
}
