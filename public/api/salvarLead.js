/* ================================================================
   RFootball Store — api/salvarLead.js v3
   Vercel Serverless Function — Resend Email
   ================================================================ */

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST')
    return res.status(405).json({ success: false, message: 'Método não permitido.' });

  try {
    const data = req.body;
    console.log('📥 Lead recebido:', JSON.stringify(data));

    if (!data || !data.nome || data.nome.trim() === '') {
      return res.status(422).json({ success: false, message: 'Nome é obrigatório.' });
    }

    const lead = {
      nome:          String(data.nome          || '').trim().substring(0, 200),
      interesse:     String(data.interesse     || '').trim().substring(0, 200),
      produto:       String(data.produto       || '').trim().substring(0, 200),
      assunto:       String(data.assunto       || '').trim().substring(0, 500),
      forma_contato: String(data.forma_contato || '').trim().substring(0, 50),
      whatsapp:      String(data.whatsapp      || '').trim().substring(0, 50),
      email:         String(data.email         || '').trim().substring(0, 200),
      data:          new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
    };

    const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
    const EMAIL_DESTINO  = process.env.EMAIL_DESTINO  || '';

    console.log('🔑 RESEND_API_KEY:', RESEND_API_KEY ? `Sim (${RESEND_API_KEY.substring(0,8)}...)` : 'NÃO CONFIGURADA');
    console.log('📧 EMAIL_DESTINO:', EMAIL_DESTINO || 'NÃO CONFIGURADO');

    if (!RESEND_API_KEY) return res.status(200).json({ success: false, message: 'RESEND_API_KEY não configurada.' });
    if (!EMAIL_DESTINO)  return res.status(200).json({ success: false, message: 'EMAIL_DESTINO não configurado.' });

    // ── Definir tipo de lead e cor do badge ─────
    const ehCompra  = lead.interesse.toLowerCase().includes('comprar');
    const ehDuvida  = lead.interesse.toLowerCase().includes('d') && lead.interesse.toLowerCase().includes('vida');
    const tipoLead  = ehCompra ? 'COMPRA' : ehDuvida ? 'DÚVIDA' : 'OUTRO ASSUNTO';
    const corBadge  = ehCompra ? '#25d366' : ehDuvida ? '#2563eb' : '#8696a0';
    const emojiBadge= ehCompra ? '🛒' : ehDuvida ? '❓' : '💬';

    // ── Bloco dinâmico por tipo ──────────────────
    let blocoEspecifico = '';

    if (ehCompra && lead.produto) {
      blocoEspecifico = `
        <tr style="background:#f0fdf4;border-bottom:1px solid #bbf7d0;">
          <td style="padding:10px 12px;color:#166534;font-size:14px;font-weight:600;">👕 Quer comprar</td>
          <td style="padding:10px 12px;font-size:15px;font-weight:700;color:#166534;">${lead.produto}</td>
        </tr>`;
    } else if (!ehCompra && lead.assunto) {
      blocoEspecifico = `
        <tr style="background:#eff6ff;border-bottom:1px solid #bfdbfe;">
          <td style="padding:10px 12px;color:#1e40af;font-size:14px;font-weight:600;">${emojiBadge} ${tipoLead}</td>
          <td style="padding:10px 12px;font-size:14px;color:#1e40af;">${lead.assunto}</td>
        </tr>`;
    }

    const contatoLinha = lead.forma_contato === 'WhatsApp'
      ? `<tr><td style="padding:8px 12px;color:#555;font-size:14px;">📱 WhatsApp</td><td style="padding:8px 12px;font-size:14px;font-weight:600;">${lead.whatsapp}</td></tr>`
      : `<tr><td style="padding:8px 12px;color:#555;font-size:14px;">✉️ E-mail</td><td style="padding:8px 12px;font-size:14px;font-weight:600;">${lead.email}</td></tr>`;

    const assuntoSubject = ehCompra
      ? `🛒 Quer comprar: ${lead.produto || 'camisa'}`
      : ehDuvida
        ? `❓ Dúvida: ${lead.assunto ? lead.assunto.substring(0,50) : 'sem detalhe'}`
        : `💬 Outro assunto: ${lead.assunto ? lead.assunto.substring(0,50) : 'sem detalhe'}`;

    const htmlEmail = `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:32px 0;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08);max-width:580px;">

        <!-- HEADER -->
        <tr>
          <td style="background:#075e54;padding:28px 32px;text-align:center;">
            <div style="font-size:36px;margin-bottom:8px;">⚽</div>
            <h1 style="color:#fff;margin:0;font-size:22px;font-weight:700;">Novo Lead — RFootball Store</h1>
            <p style="color:#b2dfdb;margin:6px 0 0;font-size:13px;">Recebido em ${lead.data}</p>
          </td>
        </tr>

        <!-- BADGE TIPO -->
        <tr>
          <td style="background:${corBadge};padding:12px 32px;text-align:center;">
            <span style="color:#fff;font-size:16px;font-weight:700;letter-spacing:.5px;">${emojiBadge} ${tipoLead}</span>
          </td>
        </tr>

        <!-- DADOS -->
        <tr>
          <td style="padding:28px 32px;">
            <p style="margin:0 0 16px;font-size:15px;color:#333;">Novo visitante completou o chat:</p>

            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8e8e8;border-radius:8px;overflow:hidden;margin-bottom:24px;">
              <thead>
                <tr style="background:#f9f9f9;">
                  <th style="padding:10px 12px;text-align:left;font-size:12px;color:#888;border-bottom:1px solid #e8e8e8;width:40%;">Campo</th>
                  <th style="padding:10px 12px;text-align:left;font-size:12px;color:#888;border-bottom:1px solid #e8e8e8;">Informação</th>
                </tr>
              </thead>
              <tbody>
                <tr style="border-bottom:1px solid #f0f0f0;">
                  <td style="padding:10px 12px;color:#555;font-size:14px;">👤 Nome</td>
                  <td style="padding:10px 12px;font-size:15px;font-weight:700;">${lead.nome}</td>
                </tr>
                ${blocoEspecifico}
                ${contatoLinha}
                <tr style="background:#fafafa;">
                  <td style="padding:8px 12px;color:#555;font-size:13px;">🕐 Data</td>
                  <td style="padding:8px 12px;font-size:13px;color:#888;">${lead.data}</td>
                </tr>
              </tbody>
            </table>

            <!-- BOTÕES AÇÃO -->
            <p style="margin:0 0 12px;font-size:14px;color:#555;font-weight:600;">Responder agora:</p>
            ${lead.whatsapp ? `<div style="margin-bottom:10px;"><a href="https://wa.me/55${lead.whatsapp.replace(/\D/g,'')}" style="display:inline-block;background:#25d366;color:#fff;text-decoration:none;padding:13px 28px;border-radius:24px;font-size:15px;font-weight:600;box-shadow:0 2px 8px rgba(37,211,102,.3);">💬 Responder no WhatsApp</a></div>` : ''}
            ${lead.email ? `<div style="margin-bottom:10px;"><a href="mailto:${lead.email}?subject=RFootball Store — ${encodeURIComponent(assuntoSubject)}" style="display:inline-block;background:#075e54;color:#fff;text-decoration:none;padding:13px 28px;border-radius:24px;font-size:15px;font-weight:600;box-shadow:0 2px 8px rgba(7,94,84,.3);">✉️ Responder por E-mail</a></div>` : ''}
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="background:#f9f9f9;padding:16px 32px;border-top:1px solid #eee;text-align:center;">
            <p style="margin:0;font-size:12px;color:#aaa;">RFootball Store — a melhor qualidade em camisas de futebol por um preço acessível.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body></html>`;

    const payload = {
      from:    'RFootball Store <onboarding@resend.dev>',
      to:      [EMAIL_DESTINO],
      subject: `⚽ ${lead.nome} — ${assuntoSubject}`,
      html:    htmlEmail,
    };

    const resendRes  = await fetch('https://api.resend.com/emails', {
      method:  'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });

    const resendData = await resendRes.json();
    console.log('📨 Resend status:', resendRes.status, JSON.stringify(resendData));

    if (!resendRes.ok) {
      return res.status(200).json({ success: false, message: `Resend: ${resendData.message||'erro'}`, resend: resendData });
    }

    return res.status(200).json({ success: true, message: 'E-mail enviado!', emailId: resendData.id });

  } catch (err) {
    console.error('💥 Erro interno:', err.message);
    return res.status(500).json({ success: false, message: err.message });
  }
};
