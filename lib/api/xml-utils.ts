// Shared XML parsing utilities for EWS API responses.
// Used by both printer.ts and jobs.ts to parse HP LEDM XML.

/**
 * Fetch with timeout and abort controller.
 * Throws if request takes longer than specified timeout.
 */
export async function fetchWithTimeout(
  url: string,
  timeout = 5000,
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

/**
 * Fetch a URL and parse the response as XML.
 * Uses 5 second timeout by default.
 */
export async function parseXmlResponse(url: string): Promise<Document> {
  const response = await fetchWithTimeout(url);
  const text = await response.text();
  const parser = new DOMParser();
  return parser.parseFromString(text, "text/xml");
}

/**
 * Get text content of first element matching localName (ignores namespace).
 * Searches entire document tree.
 */
export function getTextContent(
  xml: Document,
  localName: string,
): string | null {
  const elements = xml.getElementsByTagName("*");
  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    if (el.localName === localName) {
      return el.textContent;
    }
  }
  return null;
}

/**
 * Get all elements matching localName (ignores namespace).
 * Works with both Document and Element containers.
 */
export function getAllElements(
  xml: Document | Element,
  localName: string,
): Element[] {
  const container = xml as Document;
  const elements = container.getElementsByTagName("*");
  const matches: Element[] = [];
  for (let i = 0; i < elements.length; i++) {
    if (elements[i].localName === localName) {
      matches.push(elements[i]);
    }
  }
  return matches;
}

/**
 * Get text content of first child element matching localName.
 * More targeted than getTextContent - only searches direct descendants.
 */
export function getChildText(
  parent: Element,
  localName: string,
): string | null {
  const children = parent.getElementsByTagName("*");
  for (let i = 0; i < children.length; i++) {
    if (children[i].localName === localName) {
      return children[i].textContent;
    }
  }
  return null;
}
