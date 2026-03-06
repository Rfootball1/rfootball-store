/* ================================================================
   RFootball Store — api/salvarLead.js
   Vercel Serverless Function
   Envia lead por e-mail usando Resend (resend.com)
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

    if (!data || !data.nome || data.nome.trim() === '') {
      return res.status(422).json({ success: false, message: 'Nome é obrigatório.' });
    }

    // ── Sanitizar ──────────────────────────────────
    const lead = {
      nome:          String(data.nome          || '').trim().substring(0, 200),
      interesse:     String(data.interesse     || '').trim().substring(0, 200),
      produto:       String(data.produto       || '').trim().substring(0, 200),
      forma_contato: String(data.forma_contato || '').trim().substring(0, 50),
      whatsapp:      String(data.whatsapp      || '').trim().substring(0, 50),
      email:         String(data.email         || '').trim().substring(0, 200),
      data:          new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
    };

    // ── Variáveis de ambiente ───────────────────────
    const RESEND_API_KEY  = process.env.RESEND_API_KEY  || '';
    const EMAIL_DESTINO   = process.env.EMAIL_DESTINO   || '';

    if (!RESEND_API_KEY || !EMAIL_DESTINO) {
      console.warn('⚠️ RESEND_API_KEY ou EMAIL_DESTINO não configurados.');
      return res.status(200).json({ success: true, message: 'Lead recebido (e-mail não configurado).', nome: lead.nome });
    }

    // ── Montar HTML do e-mail ───────────────────────
    const contatoLinha = lead.forma_contato === 'WhatsApp'
      ? `<tr><td style="padding:8px 12px;color:#555;font-size:14px;">📱 WhatsApp</td><td style="padding:8px 12px;font-size:14px;font-weight:600;">${lead.whatsapp}</td></tr>`
      : `<tr><td style="padding:8px 12px;color:#555;font-size:14px;">✉️ E-mail</td><td style="padding:8px 12px;font-size:14px;font-weight:600;">${lead.email}</td></tr>`;

    const htmlEmail = `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:32px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08);">

        <!-- Header -->
        <tr>
          <td style="background:#075e54;padding:28px 32px;text-align:center;">
            <div style="font-size:32px;margin-bottom:8px;">⚽</div>
            <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:700;letter-spacing:.5px;">
              Novo Lead — RFootball Store
            </h1>
            <p style="color:#b2dfdb;margin:6px 0 0;font-size:13px;">
              Recebido em ${lead.data}
            </p>
          </td>
        </tr>

        <!-- Corpo -->
        <tr>
          <td style="padding:28px 32px;">
            <p style="margin:0 0 20px;font-size:15px;color:#333;">
              🎉 Um novo visitante completou o chat e deixou os dados de contato:
            </p>

            <table width="100%" cellpadding="0" cellspacing="0"
                   style="border:1px solid #e8e8e8;border-radius:8px;overflow:hidden;margin-bottom:24px;">
              <thead>
                <tr style="background:#f9f9f9;">
                  <th style="padding:10px 12px;text-align:left;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:.5px;border-bottom:1px solid #e8e8e8;">Campo</th>
                  <th style="padding:10px 12px;text-align:left;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:.5px;border-bottom:1px solid #e8e8e8;">Informação</th>
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
                ${contatoLinha}
              </tbody>
            </table>

            <!-- Botão de ação rápida WhatsApp -->
            ${lead.whatsapp ? `
            <div style="text-align:center;margin-bottom:24px;">
              <a href="https://wa.me/55${lead.whatsapp.replace(/\D/g,'')}"
                 style="display:inline-block;background:#25d366;color:#ffffff;text-decoration:none;
                        padding:12px 28px;border-radius:24px;font-size:15px;font-weight:600;">
                💬 Responder no WhatsApp
              </a>
            </div>` : ''}

            ${lead.email ? `
            <div style="text-align:center;margin-bottom:24px;">
              <a href="mailto:${lead.email}?subject=RFootball Store — ${encodeURIComponent(lead.produto)}"
                 style="display:inline-block;background:#075e54;color:#ffffff;text-decoration:none;
                        padding:12px 28px;border-radius:24px;font-size:15px;font-weight:600;">
                ✉️ Responder por E-mail
              </a>
            </div>` : ''}

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9f9f9;padding:16px 32px;border-top:1px solid #eee;text-align:center;">
            <p style="margin:0;font-size:12px;color:#aaa;">
              RFootball Store — a melhor qualidade em camisas de futebol por um preço acessível.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

    // ── Texto simples (fallback) ────────────────────
    const textoSimples = `
Novo Lead — RFootball Store
============================
Data:           ${lead.data}
Nome:           ${lead.nome}
Interesse:      ${lead.interesse}
Produto:        ${lead.produto}
Forma contato:  ${lead.forma_contato}
WhatsApp:       ${lead.whatsapp || '—'}
E-mail:         ${lead.email    || '—'}
============================
RFootball Store — a melhor qualidade em camisas de futebol por um preço acessível.
`.trim();

    // ── Enviar via Resend API ───────────────────────
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        from:    'RFootball Store <leads@rfootball.store>',
        to:      [EMAIL_DESTINO],
        subject: `⚽ Novo lead: ${lead.nome} quer ${lead.produto}`,
        html:    htmlEmail,
        text:    textoSimples,
      }),
    });

    const resendData = await resendRes.json();

    if (!resendRes.ok) {
      console.error('❌ Resend erro:', resendData);
      // Retorna sucesso ao frontend mesmo assim (UX não quebra)
      return res.status(200).json({ success: true, message: 'Lead recebido.', nome: lead.nome });
    }

    console.log('✅ E-mail enviado! ID:', resendData.id);

    return res.status(200).json({
      success:   true,
      message:   'Lead salvo e e-mail enviado com sucesso.',
      nome:      lead.nome,
      timestamp: lead.data,
    });

  } catch (err) {
    console.error('Erro interno:', err);
    return res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
  }
}
