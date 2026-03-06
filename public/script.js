/* ================================================================
   RFootball Store — Chat Lead Collector
   script.js — Versão Avançada com IA e Detecção de Times
   ================================================================ */
'use strict';

/* ── Estado global ──────────────────────────── */
const lead = {
  interesse: '', produto: '', assunto: '', nome: '',
  forma_contato: '', whatsapp: '', email: '', data: ''
};

let currentStep   = 0;
let isBotTyping   = false;
let badgeCount    = 0;
let pendingCallback = null;
let pendingInputCallback = null;

/* ── Elementos DOM ──────────────────────────── */
const messagesContainer = document.getElementById('chat-messages');
const typingIndicator   = document.getElementById('typing-indicator');
const optionsArea       = document.getElementById('options-area');
const msgInput          = document.getElementById('msg-input');
const sendBtn           = document.getElementById('send-btn');
const chatWrap          = document.getElementById('chat-messages-wrap');
const dateLabel         = document.getElementById('date-label');
const sidebarBadge      = document.getElementById('sidebar-badge');
const sidebarTime       = document.getElementById('sidebar-time');
const sidebarPreview    = document.getElementById('sidebar-preview');
const toast             = document.getElementById('toast');
const headerStatus      = document.getElementById('header-status');

/* ── Mapa de times e imagens ─────────────────── */
const TIMES = {
  flamengo:   { nome: 'Flamengo',              img: 'img/flamengo.jpg'   },
  corinthians:{ nome: 'Corinthians',           img: 'img/corinthians.jpg'},
  palmeiras:  { nome: 'Palmeiras',             img: 'img/palmeiras.jpg'  },
  saopaulo:   { nome: 'São Paulo',             img: 'img/saopaulo.jpg'   },
  santos:     { nome: 'Santos',                img: 'img/santos.jpg'     },
  vasco:      { nome: 'Vasco',                 img: 'img/vasco.jpg'      },
  gremio:     { nome: 'Grêmio',               img: 'img/gremio.jpg'     },
  internacional:{ nome: 'Internacional',       img: 'img/internacional.jpg'},
  atletico:   { nome: 'Atlético Mineiro',      img: 'img/atletico.jpg'   },
  cruzeiro:   { nome: 'Cruzeiro',              img: 'img/cruzeiro.jpg'   },
  fluminense: { nome: 'Fluminense',            img: 'img/fluminense.jpg' },
  botafogo:   { nome: 'Botafogo',              img: 'img/botafogo.jpg'   },
  bahia:      { nome: 'Bahia',                 img: 'img/bahia.jpg'      },
  fortaleza:  { nome: 'Fortaleza',             img: 'img/fortaleza.jpg'  },
  athletico:  { nome: 'Athletico Paranaense',  img: 'img/athletico.jpg'  },
};

/* Variações/aliases para detectar os times */
const ALIASES = {
  flamengo:    ['flamengo', 'fla', 'mengao', 'mengão'],
  corinthians: ['corinthians', 'corintiano', 'timao', 'timão', 'sccp'],
  palmeiras:   ['palmeiras', 'verdao', 'verdão', 'porco'],
  saopaulo:    ['sao paulo', 'são paulo', 'spfc', 'tricolor paulista', 'soberano'],
  santos:      ['santos', 'peixe', 'santista'],
  vasco:       ['vasco', 'vasco da gama', 'crvg', 'cruz maltina'],
  gremio:      ['gremio', 'grêmio', 'tricolor gaucho', 'tricolor gaúcho', 'imortal'],
  internacional:['internacional', 'inter', 'colorado'],
  atletico:    ['atletico mineiro', 'atlético mineiro', 'atletico-mg', 'atletico mg', 'galo', 'galinho'],
  cruzeiro:    ['cruzeiro', 'raposa', 'cru'],
  fluminense:  ['fluminense', 'flu', 'tricolor carioca', 'tricolor das laranjeiras'],
  botafogo:    ['botafogo', 'fogao', 'fogão', 'estrela solitaria', 'estrela solitária'],
  bahia:       ['bahia', 'esquadrão', 'esba', 'tricolor baiano'],
  fortaleza:   ['fortaleza', 'leao', 'leão', 'tricolor do pici'],
  athletico:   ['athletico paranaense', 'athletico-pr', 'athletico pr', 'cap', 'furacão', 'furacao'],
};

/* ── Palavras-chave IA simples ───────────────── */
const AI_KEYWORDS = {
  preco: {
    words: ['preco','preço','valor','quanto','custo','caro','barato','preis'],
    reply: 'Os valores variam dependendo do modelo da camisa. Posso verificar certinho para você assim que entender o que você está buscando! 😊'
  },
  entrega: {
    words: ['entrega','frete','envio','prazo','chegar','chegará','dias','semana','correios','transportadora'],
    reply: 'Trabalhamos com envio para todo o Brasil! 📦\n\nPosso verificar o prazo estimado para sua região assim que finalizarmos seu pedido.'
  },
  pagamento: {
    words: ['pagamento','pagar','pix','cartao','cartão','parcel','boleto','credito','crédito','debito','débito'],
    reply: 'Temos várias opções de pagamento disponíveis, incluindo Pix, cartão e parcelamento! 💳\n\nPosso te explicar melhor em seguida.'
  },
};

/* ── Fluxo de steps ─────────────────────────── */
const steps = [
  // Step 0 — boas-vindas
  {
    text: 'Olá! 👋 Bem-vindo à *RFootball Store*.\n\nAqui você encontra camisas de futebol com excelente qualidade e preço acessível.\n\nAntes de continuar, posso entender rapidamente o que você procura?',
    options: ['🛒 Quero comprar uma camisa', '❓ Tirar uma dúvida', '💬 Outro assunto'],
    onOption(val) {
      lead.interesse = val;
      if (val.includes('dúvida') || val.includes('Outro')) {
        currentStep = 'duvida';
        runStep('duvida');
      } else {
        advanceStep();
      }
    }
  },
  // Step 1 — qual camisa/time
  {
    text: 'Que ótimo! ⚽\n\nQual time ou camisa você está procurando?',
    input: true, placeholder: 'Ex: Flamengo, Real Madrid, Brasil...', inputType: 'text',
    onInput(val) {
      lead.produto = sanitize(val);
      const time = detectTime(val);
      if (time) {
        currentStep = 'time_detected';
        runTimeFlow(time);
      } else {
        advanceStep();
      }
    }
  },
  // Step 2 — nome
  {
    text: 'Entendido! 👍\n\nAgora me diz, qual é o seu *nome*?',
    input: true, placeholder: 'Digite seu nome...', inputType: 'text',
    onInput(val) { lead.nome = sanitize(val); advanceStep(); }
  },
  // Step 3 — forma contato
  {
    get text() { return `Prazer, *${lead.nome}*! 😊\n\nComo prefere que eu entre em contato com você?`; },
    options: ['📱 WhatsApp', '✉️ E-mail'],
    onOption(val) { lead.forma_contato = val.includes('WhatsApp') ? 'WhatsApp' : 'Email'; advanceStep(); }
  },
  // Step 4 — contato
  {
    get text() {
      return lead.forma_contato === 'WhatsApp'
        ? '📱 Perfeito!\n\nDigite seu *WhatsApp* com DDD:'
        : '✉️ Ótimo!\n\nDigite seu *e-mail*:';
    },
    get input() { return true; },
    get placeholder() { return lead.forma_contato === 'WhatsApp' ? 'Ex: 11 99999-9999' : 'seu@email.com'; },
    get inputType()   { return lead.forma_contato === 'WhatsApp' ? 'tel' : 'email'; },
    onInput(val) {
      if (lead.forma_contato === 'WhatsApp') lead.whatsapp = sanitize(val);
      else lead.email = sanitize(val);
      advanceStep();
    }
  },
  // Step 5 — final
  {
    get text() {
      const contato = lead.forma_contato === 'WhatsApp'
        ? `WhatsApp: ${lead.whatsapp}` : `E-mail: ${lead.email}`;
      return `✅ *Perfeito, ${lead.nome}!*\n\nRecebi sua solicitação sobre *${lead.produto}* e entrarei em contato pelo ${contato} em breve.\n\nObrigado por falar com a *RFootball Store* ⚽\n\n_"A melhor qualidade em camisas de futebol por um preço acessível."_`;
    },
    final: true
  }
];

/* Steps especiais (objetos fora do array) */
const specialSteps = {
  duvida: {
    text: 'Claro! Pode me contar qual é sua dúvida ou sobre o que gostaria de falar?',
    input: true, placeholder: 'Digite sua dúvida...', inputType: 'text',
    onInput(val) {
      lead.assunto = sanitize(val);
      currentStep = 'duvida_nome';
      runStep('duvida_nome');
    }
  },
  duvida_nome: {
    text: 'Perfeito! E como posso te chamar?',
    input: true, placeholder: 'Seu nome...', inputType: 'text',
    onInput(val) {
      lead.nome = sanitize(val);
      currentStep = 3;
      runStep(3);
    }
  }
};

/* ── Utilitários ─────────────────────────────── */
function sanitize(str) {
  return String(str)
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/&(?!amp;|lt;|gt;)/g, '&amp;')
    .trim()
    .substring(0, 500);
}

function removeAccents(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function detectTime(msg) {
  const norm = removeAccents(msg.toLowerCase());
  for (const [key, variants] of Object.entries(ALIASES)) {
    for (const v of variants) {
      if (norm.includes(removeAccents(v))) return key;
    }
  }
  return null;
}

function detectAIKeyword(msg) {
  const norm = removeAccents(msg.toLowerCase());
  for (const [key, data] of Object.entries(AI_KEYWORDS)) {
    if (data.words.some(w => norm.includes(w))) return data.reply;
  }
  return null;
}

function getTime() {
  return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function getTodayLabel() {
  return new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
}

function formatText(raw) {
  const e = raw.replace(/&amp;/g,'&').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  return e
    .replace(/\*([^*\n]+)\*/g,'<strong>$1</strong>')
    .replace(/_([^_\n]+)_/g,'<em>$1</em>');
}

function scrollToBottom(smooth) {
  requestAnimationFrame(() => {
    chatWrap.scrollTo({ top: chatWrap.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
  });
}

function setBadge(n) {
  if (!sidebarBadge) return;
  if (n > 0) { sidebarBadge.textContent = n > 99 ? '99+' : n; sidebarBadge.style.display = 'flex'; }
  else sidebarBadge.style.display = 'none';
}

function updateSidebar(txt) {
  if (sidebarTime) sidebarTime.textContent = getTime();
  if (sidebarPreview && txt)
    sidebarPreview.textContent = txt.replace(/\*|_/g,'').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&').split('\n')[0].substring(0,40)+'...';
}

function showToast(msg, dur) {
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), dur || 3500);
}

/* ── Mensagens ───────────────────────────────── */
function addMessage(text, type, skipAI) {
  typingIndicator.classList.remove('visible');

  // Detectar IA keywords nas mensagens do usuário
  if (type === 'user' && !skipAI) {
    const aiReply = detectAIKeyword(text);
    if (aiReply && pendingInputCallback) {
      const cb = pendingInputCallback;
      pendingInputCallback = null;
      // Mostrar msg do user, depois resposta IA, depois continuar fluxo
      _insertMessage(text, type);
      setTimeout(() => {
        botSay(aiReply, () => {
          setTimeout(() => cb(text), 600);
        });
      }, 500);
      return;
    }
  }

  _insertMessage(text, type);
}

function _insertMessage(text, type) {
  const row    = document.createElement('div');
  row.className = `msg-row ${type}`;
  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble';
  const textEl = document.createElement('div');
  textEl.className = 'msg-text';
  textEl.innerHTML = formatText(text);
  const meta   = document.createElement('div');
  meta.className = 'msg-meta';
  const timeEl = document.createElement('span');
  timeEl.className = 'msg-time';
  timeEl.textContent = getTime();
  meta.appendChild(timeEl);
  if (type === 'bot') {
    const check = document.createElement('span');
    check.className = 'msg-check read';
    check.setAttribute('aria-hidden','true');
    check.innerHTML = '✓✓';
    meta.appendChild(check);
    badgeCount++;
    setBadge(badgeCount);
    updateSidebar(text);
  }
  bubble.appendChild(textEl);
  bubble.appendChild(meta);
  row.appendChild(bubble);
  messagesContainer.insertBefore(row, typingIndicator);
  scrollToBottom(true);
}

function addImageMessage(src, altText) {
  typingIndicator.classList.remove('visible');
  const row = document.createElement('div');
  row.className = 'msg-row bot';
  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble msg-bubble-img';
  const img = document.createElement('img');
  img.src = src;
  img.alt = altText || 'Camisa de futebol';
  img.className = 'msg-img';
  img.loading = 'lazy';
  img.onerror = () => {
    // fallback se imagem não existir
    bubble.innerHTML = `<div class="msg-img-placeholder">🔴 ${altText || 'Camisa'}<br><small>Imagem em breve</small></div>`;
  };
  const meta = document.createElement('div');
  meta.className = 'msg-meta';
  const timeEl = document.createElement('span');
  timeEl.className = 'msg-time';
  timeEl.textContent = getTime();
  meta.appendChild(timeEl);
  const check = document.createElement('span');
  check.className = 'msg-check read';
  check.setAttribute('aria-hidden','true');
  check.innerHTML = '✓✓';
  meta.appendChild(check);
  bubble.appendChild(img);
  bubble.appendChild(meta);
  row.appendChild(bubble);
  messagesContainer.insertBefore(row, typingIndicator);
  badgeCount++;
  setBadge(badgeCount);
  scrollToBottom(true);
}

function showTyping()  { typingIndicator.classList.add('visible');    scrollToBottom(); }
function hideTyping()  { typingIndicator.classList.remove('visible'); }

function botSay(text, callback, delay) {
  if (isBotTyping) return;
  const d = delay || (1400 + Math.random() * 700);
  isBotTyping = true;
  showTyping();
  setTimeout(() => {
    isBotTyping = false;
    hideTyping();
    _insertMessage(text, 'bot');
    if (callback) callback();
  }, d);
}

function showOptions(options, callback) {
  optionsArea.innerHTML = '';
  optionsArea.classList.remove('hidden');
  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'opt-btn';
    btn.textContent = opt;
    btn.type = 'button';
    btn.addEventListener('click', () => {
      optionsArea.querySelectorAll('.opt-btn').forEach(b => b.disabled = true);
      _insertMessage(opt, 'user');
      optionsArea.classList.add('hidden');
      badgeCount = 0; setBadge(0);
      callback(opt);
    });
    optionsArea.appendChild(btn);
  });
  scrollToBottom(true);
}

function enableInput(placeholder, inputType, callback) {
  pendingInputCallback = callback;
  msgInput.placeholder = placeholder || 'Digite sua mensagem...';
  msgInput.setAttribute('inputmode', inputType === 'tel' ? 'tel' : inputType === 'email' ? 'email' : 'text');
  if (inputType === 'tel')   msgInput.setAttribute('autocomplete','tel');
  if (inputType === 'email') msgInput.setAttribute('autocomplete','email');
  if (inputType === 'text')  msgInput.setAttribute('autocomplete','off');
  msgInput.disabled = false;
  sendBtn.disabled  = false;
  setTimeout(() => {
    msgInput.focus();
    scrollToBottom(true);
  }, 150);
  msgInput.onkeydown = null;
  sendBtn.onclick    = null;

  function submit() {
    const val = msgInput.value.trim();
    if (!val) {
      msgInput.style.border = '1.5px solid #e74c3c';
      setTimeout(() => msgInput.style.border = '', 1200);
      return;
    }
    msgInput.disabled = true;
    sendBtn.disabled  = true;
    msgInput.value    = '';
    msgInput.style.height = '';
    msgInput.removeAttribute('autocomplete');
    msgInput.removeAttribute('inputmode');
    badgeCount = 0; setBadge(0);
    const cb = pendingInputCallback;
    pendingInputCallback = null;
    addMessage(val, 'user');
    if (cb) cb(val);
  }
  msgInput.onkeydown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } };
  sendBtn.onclick    = submit;
  msgInput.oninput   = () => {
    msgInput.style.height = 'auto';
    msgInput.style.height = Math.min(msgInput.scrollHeight, 120) + 'px';
  };
}

/* ── Fluxo de detecção de time ───────────────── */
function runTimeFlow(timeKey) {
  const time = TIMES[timeKey];
  botSay(`Boa escolha! 🔥\n\nOlha um exemplo da camisa da temporada atual:`, () => {
    setTimeout(() => {
      addImageMessage(time.img, `Camisa ${time.nome}`);
      setTimeout(() => {
        botSay(`Essa é uma das camisas mais procuradas! 🏆\n\nSe quiser, posso verificar a disponibilidade para você.`, () => {
          currentStep = 2; // próximo: pedir nome
          runStep(2);
        }, 1600);
      }, 800);
    }, 500);
  });
}

/* ── Execução de steps ───────────────────────── */
function advanceStep() {
  if (typeof currentStep === 'number') {
    currentStep++;
    if (currentStep < steps.length) runStep(currentStep);
  }
}

function runStep(index) {
  let step;
  if (typeof index === 'string') {
    step = specialSteps[index];
  } else {
    step = steps[index];
  }
  if (!step) return;

  botSay(step.text, () => {
    if (step.final) { finalizeLead(); return; }
    if (step.options) showOptions(step.options, step.onOption.bind(step));
    else if (step.input) enableInput(step.placeholder, step.inputType, step.onInput.bind(step));
  });
}

/* ── Finalizar e salvar lead ─────────────────── */
function finalizeLead() {
  lead.data = new Date().toISOString();
  msgInput.disabled = true;
  sendBtn.disabled  = true;
  msgInput.placeholder = 'Conversa encerrada ✓';
  optionsArea.classList.add('hidden');
  sendLead({ ...lead });
}

async function sendLead(data) {
  try {
    const res = await fetch('/api/salvarLead', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(data)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const result = await res.json();
    if (result.success) {
      console.log('✅ Lead salvo:', result);
      showToast('✅ Mensagem recebida! Entraremos em contato em breve.', 4000);
    } else {
      throw new Error(result.message);
    }
  } catch (err) {
    console.warn('⚠️ Erro ao salvar lead:', err.message);
    showToast('✅ Solicitação registrada! Em breve entraremos em contato.', 4000);
  }
}

/* ── Teclado mobile — manter input visível ───── */
function handleResize() {
  scrollToBottom(false);
}

/* ── Inicialização ───────────────────────────── */
function init() {
  dateLabel.textContent = getTodayLabel();
  setBadge(0);

  // Gerar prova social aleatória
  const socialCount = Math.floor(Math.random() * (1500 - 800 + 1)) + 800;
  const socialEl = document.getElementById('social-proof');
  if (socialEl) socialEl.textContent = `Mais de ${socialCount.toLocaleString('pt-BR')} pessoas já encontraram sua camisa aqui.`;

  // Notificação de entrada + digitando
  setTimeout(() => {
    addSystemMessage('Robson entrou no chat.');
    setTimeout(() => {
      headerStatus.textContent = 'digitando...';
      headerStatus.className = 'typing';
      setTimeout(() => {
        headerStatus.textContent = 'online';
        headerStatus.className = 'online';
        runStep(0);
      }, 1200);
    }, 1000);
  }, 700);

  // Resize para teclado mobile
  window.addEventListener('resize', handleResize);
  window.visualViewport && window.visualViewport.addEventListener('resize', () => {
    scrollToBottom(false);
  });
}

function addSystemMessage(text) {
  const div = document.createElement('div');
  div.className = 'system-msg';
  div.textContent = text;
  messagesContainer.insertBefore(div, typingIndicator);
  scrollToBottom(false);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
