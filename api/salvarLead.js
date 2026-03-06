/* ================================================================
   RFootball Store — api/salvarLead.js
   Vercel Serverless Function — Resend Email + leads.json
   ================================================================ */
const fs   = require('fs');
const path = require('path');

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

    // Sanitize all fields
    function s(v, max) { return String(v || '').replace(/</g,'&lt;').replace(/>/g,'&gt;').trim().substring(0, max || 200); }

    const lead = {
      nome:          s(data.nome, 200),
      interesse:     s(data.interesse, 200),
      produto:       s(data.produto, 200),
      assunto:       s(data.assunto, 500),
      forma_contato: s(data.forma_contato, 50),
      whatsapp:      s(data.whatsapp, 50),
      email:         s(data.email, 200),
      data:          new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
    };

    // ── Salvar em leads.json ─────────────────────
    try {
      const leadsPath = path.join('/tmp', 'leads.json');
      let leads = [];
      if (fs.existsSync(leadsPath)) {
        const raw = fs.readFileSync(leadsPath, 'utf8');
        leads = JSON.parse(raw);
      }
      leads.push(lead);
      fs.writeFileSync(leadsPath, JSON.stringify(leads, null, 2), 'utf8');
      console.log('💾 Lead salvo em leads.json');
    } catch (fsErr) {
      console.warn('⚠️ Não foi possível salvar leads.json:', fsErr.message);
    }

    // ── Verificar variáveis de ambiente ─────────
    const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
    const EMAIL_DESTINO  = process.env.EMAIL_DESTINO  || '';

    if (!RESEND_API_KEY || !EMAIL_DESTINO) {
      console.warn('⚠️ Resend não configurado — retornando success sem enviar e-mail.');
      return res.status(200).json({ success: true, message: 'Lead salvo localmente.', nome: lead.nome });
    }

    // ── Montar e-mail ───────────────────────────
    const contatoLinha = lead.forma_contato === 'WhatsApp'
      ? `<tr><td style="padding:8px 12px;color:#555;font-size:14px;">📱 WhatsApp</td><td style="padding:8px 12px;font-size:14px;font-weight:600;">${lead.whatsapp}</td></tr>`
      : `<tr><td style="padding:8px 12px;color:#555;font-size:14px;">✉️ E-mail</td><td style="padding:8px 12px;font-size:14px;font-weight:600;">${lead.email}</td></tr>`;

    const assuntoRow = lead.assunto
      ? `<tr style="border-bottom:1px solid #f0f0f0;"><td style="padding:8px 12px;color:#555;font-size:14px;">💬 Assunto</td><td style="padding:8px 12px;font-size:14px;">${lead.assunto}</td></tr>`
      : '';

    const htmlEmail = `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:32px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08);">
        <tr>
          <td style="background:#075e54;padding:28px 32px;text-align:center;">
            <div style="font-size:32px;margin-bottom:8px;">⚽</div>
            <h1 style="color:#fff;margin:0;font-size:22px;">Novo Lead — RFootball Store</h1>
            <p style="color:#b2dfdb;margin:6px 0 0;font-size:13px;">Recebido em ${lead.data}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px;">
            <p style="margin:0 0 20px;font-size:15px;color:#333;">🎉 Novo visitante completou o chat:</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8e8e8;border-radius:8px;overflow:hidden;margin-bottom:24px;">
              <thead>
                <tr style="background:#f9f9f9;">
                  <th style="padding:10px 12px;text-align:left;font-size:12px;color:#888;border-bottom:1px solid #e8e8e8;">Campo</th>
                  <th style="padding:10px 12px;text-align:left;font-size:12px;color:#888;border-bottom:1px solid #e8e8e8;">Informação</th>
                </tr>
              </thead>
              <tbody>
                <tr style="border-bottom:1px solid #f0f0f0;">
                  <td style="padding:8px 12px;color:#555;font-size:14px;">👤 Nome</td>
                  <td style="padding:8px 12px;font-size:14px;font-weight:600;">${lead.nome}</td>
                </tr>
                <tr style="background:#fafafa;border-bottom:1px solid #f0f0f0;">
                  <td style="padding:8px 12px;color:#555;font-size:14px;">🎯 Interesse</td>
                  <td style="padding:8px 12px;font-size:14px;">${lead.interesse}</td>
                </tr>
                <tr style="border-bottom:1px solid #f0f0f0;">
                  <td style="padding:8px 12px;color:#555;font-size:14px;">👕 Produto</td>
                  <td style="padding:8px 12px;font-size:14px;font-weight:600;">${lead.produto}</td>
                </tr>
                ${assuntoRow}
                ${contatoLinha}
              </tbody>
            </table>
            ${lead.whatsapp ? `<div style="text-align:center;margin-bottom:16px;"><a href="https://wa.me/55${lead.whatsapp.replace(/\D/g,'')}" style="display:inline-block;background:#25d366;color:#fff;text-decoration:none;padding:12px 28px;border-radius:24px;font-size:15px;font-weight:600;">💬 Responder no WhatsApp</a></div>` : ''}
            ${lead.email ? `<div style="text-align:center;margin-bottom:16px;"><a href="mailto:${lead.email}" style="display:inline-block;background:#075e54;color:#fff;text-decoration:none;padding:12px 28px;border-radius:24px;font-size:15px;font-weight:600;">✉️ Responder por E-mail</a></div>` : ''}
          </td>
        </tr>
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
      subject: `⚽ Novo lead: ${lead.nome} — ${lead.produto || lead.assunto || 'sem especificação'}`,
      html:    htmlEmail,
    };

    const resendRes = await fetch('https://api.resend.com/emails', {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify(payload),
    });

    const resendData = await resendRes.json();

    if (!resendRes.ok) {
      console.error('❌ Resend erro:', resendData);
      return res.status(200).json({
        success: false,
        message: `Resend erro: ${resendData.message || resendData.name || 'desconhecido'}`,
        resend:  resendData
      });
    }

    console.log('✅ E-mail enviado! ID:', resendData.id);
    return res.status(200).json({
      success:   true,
      message:   'E-mail enviado com sucesso.',
      emailId:   resendData.id,
      nome:      lead.nome,
      timestamp: lead.data,
    });

  } catch (err) {
    console.error('💥 Erro interno:', err.message, err.stack);
    return res.status(500).json({ success: false, message: err.message });
  }
};
