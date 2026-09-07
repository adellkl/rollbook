const allowedHosts = ['smoothcomp.com', 'cfjjb.com'];
const htmlHeaders = {
  Accept: 'text/html,application/xhtml+xml',
  'User-Agent': 'Rollbook event importer',
};

type ImportedEvent = {
  name: string;
  image?: string;
  city?: string;
  startsOn?: string;
  sourceUrl: string;
  organizer: 'Smoothcomp' | 'CFJJB';
};

function isAllowedHost(hostname: string) {
  return allowedHosts.some(
    (host) => hostname === host || hostname.endsWith(`.${host}`),
  );
}
function isSmoothcomp(hostname: string) {
  return hostname === 'smoothcomp.com' || hostname.endsWith('.smoothcomp.com');
}
function decode(value: string) {
  return value
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .trim();
}
function cleanTitle(title: string) {
  return title
    .replace(/\s*[|–—-]\s*(Smoothcomp|CFJJB).*$/i, '')
    .replace(/^Smoothcomp\s*[|–—-]\s*/i, '')
    .trim();
}
function meta(html: string, key: string) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  for (const pattern of [
    new RegExp(
      `<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)["']`,
      'i',
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escaped}["']`,
      'i',
    ),
  ]) {
    const match = html.match(pattern);
    if (match?.[1]) return decode(match[1]);
  }
  return undefined;
}
function eventId(url: URL) {
  return url.pathname.match(/\/event\/(\d+)/i)?.[1];
}
function imageUrl(value: unknown, base: URL) {
  if (typeof value !== 'string' || !value) return undefined;
  try {
    return new URL(value, base).toString();
  } catch {
    return undefined;
  }
}
function dateOnly(value: unknown) {
  if (typeof value !== 'string') return undefined;
  const normalized = value
    .replace(/(\d)(?:st|nd|rd|th)\b/gi, '$1')
    .replace(/\s+/g, ' ')
    .trim();
  const iso = normalized.match(/^\d{4}-\d{2}-\d{2}/)?.[0];
  if (iso) return iso;
  const numeric = normalized.match(/^(\d{1,2})[/.](\d{1,2})[/.](\d{4})$/);
  if (numeric) {
    const [, day, month, year] = numeric;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime())
    ? undefined
    : parsed.toISOString().slice(0, 10);
}
function visibleText(html: string) {
  return decode(
    html
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' '),
  );
}
function labeledEventStartDate(html: string) {
  const text = visibleText(html);
  const date = '(?:(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\\s*)?' +
    '(?:[A-Za-z]{3,9}\\.?\\s+\\d{1,2}(?:st|nd|rd|th)?[,]?\\s+\\d{4}|\\d{1,2}(?:st|nd|rd|th)?\\s+[A-Za-z]{3,9}\\.?\\s+\\d{4}|\\d{4}[./-]\\d{1,2}[./-]\\d{1,2})';
  const match = text.match(new RegExp(`(?:event\\s+starts|starts\\s+(?:on|at))\\s*:?\\s*(${date})`, 'i'));
  return match?.[1] ? dateOnly(match[1]) : undefined;
}
function eventDate(html: string) {
  const candidate =
    meta(html, 'event:start_time') ??
    meta(html, 'og:start_time') ??
    html.match(/"startDate"\s*:\s*"([^"]+)"/i)?.[1] ??
    html.match(/"start_date"\s*:\s*"([^"]+)"/i)?.[1];
  return dateOnly(candidate) ?? labeledEventStartDate(html);
}

async function eventFromPage(url: URL): Promise<ImportedEvent | undefined> {
  const response = await fetch(url, {
    headers: htmlHeaders,
    redirect: 'manual',
  });
  if (!response.ok || response.status >= 300) return undefined;
  const html = await response.text();
  const rawTitle =
    meta(html, 'og:title') ??
    meta(html, 'twitter:title') ??
    html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  const name = rawTitle ? cleanTitle(decode(rawTitle)) : '';
  if (!name || /^(just a moment|enable javascript)/i.test(name))
    return undefined;
  return {
    name,
    image: imageUrl(meta(html, 'og:image') ?? meta(html, 'twitter:image'), url),
    startsOn: eventDate(html),
    sourceUrl: url.toString(),
    organizer: isSmoothcomp(url.hostname) ? 'Smoothcomp' : 'CFJJB',
  };
}

async function eventFromSmoothcompCalendar(
  url: URL,
): Promise<ImportedEvent | undefined> {
  const id = eventId(url);
  if (!id) return undefined;
  for (const calendarUrl of [
    'https://smoothcomp.com/en/events/upcoming',
    'https://smoothcomp.com/en/events/past',
  ]) {
    const response = await fetch(calendarUrl, { headers: htmlHeaders });
    if (!response.ok) continue;
    const html = await response.text();
    const payload = html.match(/var events = (\[[\s\S]*?\])\s*<\/script>/);
    if (!payload?.[1]) continue;
    try {
      const events = JSON.parse(payload[1]) as Array<Record<string, unknown>>;
      const found = events.find((event) => String(event.id) === id);
      if (!found || typeof found.title !== 'string') continue;
      return {
        name: found.title.trim(),
        image: imageUrl(found.cover_image, url),
        city:
          typeof found.location_city === 'string'
            ? found.location_city
            : undefined,
        startsOn: dateOnly(
          found.startdate ??
            found.start_date ??
            found.startDate ??
            found.date ??
            found.starts_on,
        ),
        sourceUrl: url.toString(),
        organizer: 'Smoothcomp',
      };
    } catch {
      continue;
    }
  }
  return undefined;
}

export async function GET(request: Request) {
  const source = new URL(request.url).searchParams.get('url');
  if (!source)
    return Response.json({ error: 'Lien manquant.' }, { status: 400 });
  let url: URL;
  try {
    url = new URL(source);
  } catch {
    return Response.json({ error: 'Lien invalide.' }, { status: 400 });
  }
  if (url.protocol !== 'https:' || !isAllowedHost(url.hostname))
    return Response.json(
      { error: 'Utilise un lien Smoothcomp ou CFJJB.' },
      { status: 400 },
    );
  try {
    const imported =
      (await eventFromPage(url)) ??
      (isSmoothcomp(url.hostname)
        ? await eventFromSmoothcompCalendar(url)
        : undefined);
    if (!imported)
      return Response.json(
        {
          error:
            'Cet événement n’est pas encore disponible à l’import. Vérifie que le lien est bien celui de la page de l’événement.',
        },
        { status: 422 },
      );
    return Response.json(imported);
  } catch {
    return Response.json(
      {
        error:
          'Impossible de lire cet événement pour le moment. Réessaie dans quelques instants.',
      },
      { status: 422 },
    );
  }
}
