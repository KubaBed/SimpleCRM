import { createSupabaseClient } from '../../_lib/supabase.js'

function extractBriefData($, url) {
  const title = $('title').first().text().trim() || null
  const metaDesc = $('meta[name="description"]').attr('content')?.trim() ||
                   $('meta[property="og:description"]').attr('content')?.trim() || null
  
  const h1 = $('h1').first().text().trim() || null
  const h2s = $('h2').slice(0, 5).map((_, el) => $(el).text().trim()).get().filter(Boolean)
  
  // Fallback: pierwszy paragraf z treścią > 50 znaków
  let firstParagraph = null
  $('p').each((_, el) => {
    const text = $(el).text().trim()
    if (!firstParagraph && text.length > 50) {
      firstParagraph = text.substring(0, 300)
    }
  })
  
  // Kontakt
  const phone = $('a[href^="tel:"]').first().attr('href')?.replace('tel:', '') ||
                $('body').text().match(/\+48\s?\d{3}[\s-]?\d{3}[\s-]?\d{3}/)?.[0] || null
  
  const email = $('a[href^="mailto:"]').first().attr('href')?.replace('mailto:', '') || null
  
  // Social media
  const socials = {}
  $('a[href*="linkedin.com"]').each((_, el) => { socials.linkedin = $(el).attr('href') })
  $('a[href*="facebook.com"]').each((_, el) => { socials.facebook = $(el).attr('href') })
  
  return {
    url,
    title,
    metaDesc,
    h1,
    h2s,
    firstParagraph,
    phone,
    email,
    socials,
  }
}

function generateBriefMarkdown(data, lead) {
  const timestamp = new Date().toLocaleString('pl-PL')
  const name = data.title || lead.company_name || `${lead.first_name} ${lead.last_name}`
  
  return `## Brief ${timestamp}

**Firma:** ${name}
**WWW:** ${data.url}
**Branża:** ${lead.industry || '—'}
**Źródło:** ${lead.source || '—'}
${data.phone ? `**Telefon:** ${data.phone}` : ''}
${data.email ? `**Email:** ${data.email}` : ''}
${data.h1 ? `**H1:** ${data.h1}` : ''}
${data.metaDesc ? `**Opis:** ${data.metaDesc}` : ''}
${data.firstParagraph ? `**O firmie:** ${data.firstParagraph}` : ''}
${data.h2s.length > 0 ? `**Sekcje:** ${data.h2s.join(' | ')}` : ''}

### Prompt do AI (skopiuj)
\`\`\`text
Jesteś analitykiem sprzedaży B2B. Na podstawie poniższych danych firmowych przygotuj 3-akapitowy brief po polsku:
(1) profil firmy i branża, (2) prawdopodobne potrzeby IT/CRM/automatyzacji, (3) 2 hooki na pierwszy kontakt.

KONTEKST Z CRM:
- Imię/nazwisko: ${lead.first_name} ${lead.last_name}
- Firma: ${lead.company_name || '—'}
- Branża: ${lead.industry || '—'}
- Wielkość: ${lead.company_size || '—'}
- Źródło leada: ${lead.source || '—'}
- Szacowana wartość: ${lead.estimated_value ? lead.estimated_value + ' PLN' : '—'}
- Telefon: ${lead.phone || data.phone || '—'}
- Email: ${lead.email || data.email || '—'}

DANE ZE STRONY:
${JSON.stringify({
  url: data.url,
  title: data.title,
  h1: data.h1,
  h2s: data.h2s,
  opis: data.metaDesc || data.firstParagraph,
  telefon: data.phone,
  email: data.email,
}, null, 2)}
\`\`\`
`
}

function mergeNotes(existingNotes, briefMarkdown) {
  if (!existingNotes) return briefMarkdown
  
  // Usuń stary brief (wszystko od "## Brief" do następnego "## Brief" lub końca)
  const briefRegex = /\n?## Brief [\s\S]*?(?=\n## Brief |$)/g
  const cleaned = existingNotes.replace(briefRegex, '').trim()
  
  return cleaned ? `${cleaned}\n\n${briefMarkdown}` : briefMarkdown
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { id } = req.query
  const supabase = createSupabaseClient()

  try {
    // Pobierz leada
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', id)
      .single()

    if (leadError || !lead) {
      return res.status(404).json({ error: 'Lead not found' })
    }

    if (!lead.website) {
      return res.status(400).json({ error: 'Lead has no website' })
    }

    // Normalizuj URL
    let url = lead.website
    if (!url.startsWith('http')) url = 'https://' + url

    // Fetch strony
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)

    let html
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      })
      clearTimeout(timeout)
      
      if (!response.ok) {
        return res.status(422).json({ 
          error: `Website returned ${response.status}. Try accessing manually.` 
        })
      }
      
      html = await response.text()
    } catch (fetchError) {
      clearTimeout(timeout)
      if (fetchError.name === 'AbortError') {
        return res.status(408).json({ error: 'Website timeout (10s). Try again.' })
      }
      return res.status(422).json({ error: `Cannot fetch website: ${fetchError.message}` })
    }

    // Parsuj HTML
    const cheerio = await import('cheerio')
    const $ = cheerio.load(html)
    const data = extractBriefData($, url)

    // Generuj brief
    const briefMarkdown = generateBriefMarkdown(data, lead)

    // Zapisz w notatkach (nadpisz stary)
    const newNotes = mergeNotes(lead.notes, briefMarkdown)
    
    const { error: updateError } = await supabase
      .from('leads')
      .update({ notes: newNotes })
      .eq('id', id)

    if (updateError) {
      return res.status(500).json({ error: updateError.message })
    }

    // Log activity
    await supabase.from('activities').insert({
      lead_id: id,
      type: 'note_added',
      description: 'Brief wygenerowany automatycznie ze strony'
    })

    return res.status(200).json({ 
      success: true, 
      brief: briefMarkdown,
      notes: newNotes,
      url: data.url,
      scraped: {
        title: data.title,
        hasH1: !!data.h1,
        hasDescription: !!data.metaDesc,
        sectionsCount: data.h2s.length,
      }
    })

  } catch (error) {
    console.error('Brief generation error:', error)
    return res.status(500).json({ error: error.message })
  }
}
