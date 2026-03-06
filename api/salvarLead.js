/* ================================================================
   RFootball Store — api/salvarLead.js
   Vercel Serverless Function
   Salva lead no Google Sheets via Apps Script Web App
   ================================================================ */

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST')
    return res.status(405).json({ success: false, message: 'Método não permitido.' });

  try {
    const data = req.body;

    // Validação básica
    if (!data || !data.nome || data.nome.trim() === '') {
      return res.status(422).json({ success: false, message: 'Nome é obrigatório.' });
    }

    // ── Sanitizar ──────────────────────────────
    const lead = {
      nome:          String(data.nome          || '').trim().substring(0, 200),
      interesse:     String(data.interesse     || '').trim().substring(0, 200),
      produto:       String(data.produto       || '').trim().substring(0, 200),
      forma_contato: String(data.forma_contato || '').trim().substring(0, 50),
      whatsapp:      String(data.whatsapp      || '').trim().substring(0, 50),
      email:         String(data.email         || '').trim().substring(0, 200),
      data:          new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
    };

    // ── Enviar para Google Sheets ───────────────
    // IMPORTANTE: após configurar o Apps Script, cole a URL aqui
    const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL || '';

    if (GOOGLE_SCRIPT_URL) {
      const googleRes = await fetch(GOOGLE_SCRIPT_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(lead),
      });

      if (!googleRes.ok) {
        console.error('Google Sheets erro:', await googleRes.text());
        // Não falha — ainda retorna sucesso ao frontend
      } else {
        console.log('✅ Lead enviado ao Google Sheets');
      }
    } else {
      // Sem URL configurada — só loga (útil em dev/preview)
      console.log('📋 Lead recebido (GOOGLE_SCRIPT_URL não configurada):', lead);
    }

    return res.status(200).json({
      success:   true,
      message:   'Lead salvo com sucesso.',
      nome:      lead.nome,
      timestamp: lead.data,
    });

  } catch (err) {
    console.error('Erro interno:', err);
    return res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
  }
}
