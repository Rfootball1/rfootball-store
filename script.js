/* ================================================================
   RFootball Store — Chat Lead Collector
   script.js — Versão Vercel (endpoint /api/salvarLead)
   ================================================================ */
'use strict';

const lead = {
  interesse: '', produto: '', nome: '',
  forma_contato: '', whatsapp: '', email: '', data: ''
};

let currentStep = 0;
let isBotTyping = false;
let badgeCount  = 0;

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

const steps = [
  {
    text: 'Olá! 👋 Bem-vindo à *RFootball Store*.\n\nAqui você encontra camisas de futebol com excelente qualidade e preço acessível.\n\nAntes de continuar, posso entender rapidamente o que você procura?',
    options: ['🛒 Quero comprar uma camisa', '❓ Tirar uma dúvida', '💬 Outro assunto'],
    onOption(val) { lead.interesse = val; advanceStep(); }
  },
  {
    text: 'Que ótimo! ⚽\n\nQual time ou camisa você está procurando?',
    input: true, placeholder: 'Ex: Flamengo, Real Madrid, Brasil...', inputType: 'text',
    onInput(val) { lead.produto = val; advanceStep(); }
  },
  {
    text: 'Entendido! 👍\n\nAgora me diz, qual é o seu *nome*?',
    input: true, placeholder: 'Digite seu nome...', inputType: 'text',
    onInput(val) { lead.nome = val; advanceStep(); }
  },
  {
    get text() { return `Prazer, *${lead.nome}*! 😊\n\nComo prefere que eu entre em contato com você?`; },
    options: ['📱 WhatsApp', '✉️ E-mail'],
    onOption(val) { lead.forma_contato = val.includes('WhatsApp') ? 'WhatsApp' : 'Email'; advanceStep(); }
  },
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
      if (lead.forma_contato === 'WhatsApp') lead.whatsapp = val;
      else lead.email = val;
      advanceStep();
    }
  },
  {
    get text() {
      const contato = lead.forma_contato === 'WhatsApp'
        ? `WhatsApp: ${lead.whatsapp}` : `E-mail: ${lead.email}`;
      return `✅ *Perfeito, ${lead.nome}!*\n\nRecebi sua solicitação sobre *${lead.produto}* e entrarei em contato pelo ${contato} em breve.\n\nObrigado por falar com a *RFootball Store* ⚽\n\n_"A melhor qualidade em camisas de futebol por um preço acessível."_`;
    },
    final: true
  }
];

function getTime() {
  return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}
function getTodayLabel() {
  return new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
}
function formatText(raw) {
  const e = raw.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  return e.replace(/\*([^*\n]+)\*/g,'<strong>$1</strong>').replace(/_([^_\n]+)_/g,'<em>$1</em>');
}
function scrollToBottom() {
  requestAnimationFrame(() => { chatWrap.scrollTop = chatWrap.scrollHeight; });
}
function setBadge(n) {
  if (!sidebarBadge) return;
  if (n > 0) { sidebarBadge.textContent = n > 99 ? '99+' : n; sidebarBadge.style.display = 'flex'; }
  else sidebarBadge.style.display = 'none';
}
function updateSidebar(txt) {
  if (sidebarTime) sidebarTime.textContent = getTime();
  if (sidebarPreview && txt)
    sidebarPreview.textContent = txt.replace(/\*|_/g,'').split('\n')[0].substring(0,40)+'...';
}
function showToast(msg, dur) {
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), dur || 3500);
}

function addMessage(text, type) {
  typingIndicator.classList.remove('visible');
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
  scrollToBottom();
}

function showTyping()  { typingIndicator.classList.add('visible');    scrollToBottom(); }
function hideTyping()  { typingIndicator.classList.remove('visible'); }

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
      addMessage(opt, 'user');
      optionsArea.classList.add('hidden');
      badgeCount = 0; setBadge(0);
      callback(opt);
    });
    optionsArea.appendChild(btn);
  });
  scrollToBottom();
}

function enableInput(placeholder, inputType, callback) {
  msgInput.placeholder = placeholder || 'Digite sua mensagem...';
  msgInput.setAttribute('inputmode', inputType === 'tel' ? 'tel' : inputType === 'email' ? 'email' : 'text');
  if (inputType === 'tel')   msgInput.setAttribute('autocomplete','tel');
  if (inputType === 'email') msgInput.setAttribute('autocomplete','email');
  if (inputType === 'text')  msgInput.setAttribute('autocomplete','off');
  msgInput.disabled = false;
  sendBtn.disabled  = false;
  setTimeout(() => msgInput.focus(), 100);
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
    addMessage(val, 'user');
    badgeCount = 0; setBadge(0);
    callback(val);
  }
  msgInput.onkeydown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); } };
  sendBtn.onclick    = submit;
  msgInput.oninput   = () => {
    msgInput.style.height = 'auto';
    msgInput.style.height = Math.min(msgInput.scrollHeight, 120) + 'px';
  };
}

function advanceStep() {
  currentStep++;
  if (currentStep < steps.length) runStep(currentStep);
}

function runStep(index) {
  if (isBotTyping) return;
  const step  = steps[index];
  const text  = step.text;
  const delay = 1400 + Math.random() * 700;
  isBotTyping = true;
  showTyping();
  setTimeout(() => {
    isBotTyping = false;
    hideTyping();
    addMessage(text, 'bot');
    if (step.final) { finalizeLead(); return; }
    if (step.options) showOptions(step.options, step.onOption.bind(step));
    else if (step.input) enableInput(step.placeholder, step.inputType, step.onInput.bind(step));
  }, delay);
}

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

function init() {
  dateLabel.textContent = getTodayLabel();
  setBadge(0);
  setTimeout(() => runStep(0), 900);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();
