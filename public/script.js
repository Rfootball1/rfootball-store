/* ================================================================
   RFootball Store — script.js v3
   ================================================================ */
'use strict';

const lead = {
  interesse:'', produto:'', assunto:'', nome:'',
  forma_contato:'', whatsapp:'', email:'', data:''
};

const TIMES = {
  // ── Brasileiros ──────────────────────────────
  flamengo:     { nome:'Flamengo',             img:'img/flamengo.jpg'      },
  corinthians:  { nome:'Corinthians',          img:'img/corinthians.jpg'   },
  palmeiras:    { nome:'Palmeiras',            img:'img/palmeiras.jpg'     },
  saopaulo:     { nome:'São Paulo',            img:'img/saopaulo.jpg'      },
  santos:       { nome:'Santos',               img:'img/santos.jpg'        },
  vasco:        { nome:'Vasco',                img:'img/vasco.jpg'         },
  gremio:       { nome:'Grêmio',              img:'img/gremio.jpg'        },
  internacional:{ nome:'Internacional',        img:'img/internacional.jpg' },
  atletico:     { nome:'Atlético Mineiro',     img:'img/atletico.jpg'      },
  cruzeiro:     { nome:'Cruzeiro',             img:'img/cruzeiro.jpg'      },
  fluminense:   { nome:'Fluminense',           img:'img/fluminense.jpg'    },
  botafogo:     { nome:'Botafogo',             img:'img/botafogo.jpg'      },
  bahia:        { nome:'Bahia',                img:'img/bahia.jpg'         },
  fortaleza:    { nome:'Fortaleza',            img:'img/fortaleza.jpg'     },
  athletico:    { nome:'Athletico Paranaense', img:'img/athletico.jpg'     },

  // ── Europeus ─────────────────────────────────
  realmadrid:   { nome:'Real Madrid',          img:'img/realmadrid.jpg'    },
  barcelona:    { nome:'Barcelona',            img:'img/barcelona.jpg'     },
  manchester:   { nome:'Manchester City',      img:'img/manchester.jpg'    },
  liverpool:    { nome:'Liverpool',            img:'img/liverpool.jpg'     },
  psg:          { nome:'PSG',                  img:'img/psg.jpg'           },

  // ── Seleções — Copa do Mundo 2026 ────────────
  brasil:       { nome:'Seleção Brasileira',   img:'img/brasil.jpg'        },
  argentina:    { nome:'Argentina',            img:'img/argentina.jpg'     },
  franca:       { nome:'França',               img:'img/franca.jpg'        },
  alemanha:     { nome:'Alemanha',             img:'img/alemanha.jpg'      },
  portugal:     { nome:'Portugal',             img:'img/portugal.jpg'      },
};

const AI_RESPOSTAS = [
  { palavras:['preco','valor','custa','quanto'],
    texto:'Os valores variam dependendo do modelo da camisa. Posso verificar certinho para você! 😊' },
  { palavras:['entrega','frete','envio','prazo','demora'],
    texto:'Trabalhamos com envio para todo o Brasil! Posso verificar o prazo para sua região. 🚚' },
  { palavras:['pagamento','pagar','parcel','pix','cartao'],
    texto:'Temos várias opções de pagamento disponíveis — PIX, cartão e parcelamento. Posso te explicar melhor! 💳' },
];

let currentStep  = 0;
let isBotTyping  = false;
let badgeCount   = 0;
let teamDetected = null;
const stepHistory = [];

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
const joinMsg           = document.getElementById('join-msg');
const proofCount        = document.getElementById('proof-count');

// ================================================================
// STEPS
// ================================================================
const steps = [
  // 0 — Boas-vindas
  {
    text: 'Olá! 👋 Bem-vindo à *RFootball Store*.\n\nAqui você encontra camisas de futebol com excelente qualidade e preço acessível.\n\nComo posso te ajudar hoje?',
    options: ['🛒 Quero comprar uma camisa', '❓ Tirar uma dúvida', '💬 Outro assunto'],
    optClasses: ['opt-primary', 'opt-secondary', 'opt-tertiary'],
    onOption(val) { lead.interesse = val; advanceStep(); }
  },
  // 1 — Produto / Dúvida / Assunto
  {
    get text() {
      if (lead.interesse.includes('comprar'))
        return 'Que ótimo! ⚽\n\nQual time ou camisa você está procurando?';
      if (lead.interesse.includes('dúvida') || lead.interesse.includes('Dúvida'))
        return 'Claro! Pode me contar sua dúvida aqui embaixo 👇';
      return 'Sem problema! Sobre o que você gostaria de falar? ✍️';
    },
    input: true,
    get placeholder() {
      if (lead.interesse.includes('comprar')) return 'Ex: Flamengo, Real Madrid, Brasil...';
      if (lead.interesse.includes('dúvida') || lead.interesse.includes('Dúvida')) return 'Digite sua dúvida aqui...';
      return 'Digite seu assunto aqui...';
    },
    inputType: 'text',
    onInput(val) {
      if (lead.interesse.includes('comprar')) {
        lead.produto = val;
        teamDetected = detectarTime(val);
      } else {
        lead.assunto = val;
      }
      advanceStep();
    }
  },
  // 2 — Nome (ou imagem do time + confirmação)
  {
    get text() {
      if (teamDetected) {
        const ehSelecao = ['brasil','argentina','franca','alemanha','portugal'].includes(teamDetected);
        if (ehSelecao) return `Boa escolha! 🌍\n\n*Copa do Mundo 2026* está chegando! Olha a camisa mais recente:`;
        const ehEuropeu = ['realmadrid','barcelona','manchester','liverpool','psg'].includes(teamDetected);
        if (ehEuropeu) return `Boa escolha! 🏆\n\nOlha um exemplo da camisa da temporada atual:`;
        return `Boa escolha! 🔥\n\nOlha um exemplo da camisa da temporada atual:`;
      }
      if (lead.assunto) return `Perfeito, anotei! 📝\n\nE como posso te chamar?`;
      return `Entendido! 👍\n\nQual é o seu *nome*?`;
    },
    input: true,
    placeholder: 'Digite seu nome...',
    inputType: 'text',
    onInput(val) { lead.nome = val; advanceStep(); }
  },
  // 3 — Forma de contato
  {
    get text() { return `Prazer, *${lead.nome}*! 😊\n\nComo prefere que eu entre em contato com você?`; },
    options: ['📱 WhatsApp', '✉️ E-mail'],
    optClasses: ['opt-whatsapp', 'opt-email'],
    onOption(val) { lead.forma_contato = val.includes('WhatsApp') ? 'WhatsApp' : 'Email'; advanceStep(); }
  },
  // 4 — Dados de contato
  {
    get text() {
      return lead.forma_contato === 'WhatsApp'
        ? '📱 Perfeito!\n\nDigite seu *WhatsApp* com DDD:'
        : '✉️ Ótimo!\n\nDigite seu *e-mail*:';
    },
    get input()       { return true; },
    get placeholder() { return lead.forma_contato === 'WhatsApp' ? 'Ex: 11 99999-9999' : 'seu@email.com'; },
    get inputType()   { return lead.forma_contato === 'WhatsApp' ? 'tel' : 'email'; },
    onInput(val) {
      if (lead.forma_contato === 'WhatsApp') lead.whatsapp = val;
      else lead.email = val;
      advanceStep();
    }
  },
  // 5 — Final
  {
    get text() {
      const contato = lead.forma_contato === 'WhatsApp'
        ? `WhatsApp: ${lead.whatsapp}` : `E-mail: ${lead.email}`;
      return `Pronto! Recebi suas informações. ✅\n\nAssim que possível entrarei em contato pelo ${contato}.\n\nEnquanto isso, acompanhe as novidades da *RFootball Store* nas redes sociais ⚽`;
    },
    final: true
  }
];

// ================================================================
// UTILITÁRIOS
// ================================================================
function normalizar(str) {
  return str.toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9 ]/g,' ');
}
function detectarTime(texto) {
  const t = normalizar(texto);
  const mapa = {
    // Brasileiros
    flamengo:     ['flamengo','fla','mengao'],
    corinthians:  ['corinthians','coringao','timao'],
    palmeiras:    ['palmeiras','verdao','porco'],
    saopaulo:     ['sao paulo','spfc','tricolor paulista'],
    santos:       ['santos','peixe'],
    vasco:        ['vasco','cruzmaltino'],
    gremio:       ['gremio','imortal'],
    internacional:['internacional','inter','colorado'],
    atletico:     ['atletico mineiro','atletico mg','galo'],
    cruzeiro:     ['cruzeiro','raposa'],
    fluminense:   ['fluminense','flu'],
    botafogo:     ['botafogo','glorioso'],
    bahia:        ['bahia','esquadrao'],
    fortaleza:    ['fortaleza','leao do pici'],
    athletico:    ['athletico paranaense','athletico','furacao','cap'],
    // Europeus
    realmadrid:   ['real madrid','merengue','madrid'],
    barcelona:    ['barcelona','barca','blaugrana'],
    manchester:   ['manchester city','man city','citizens','manchester'],
    liverpool:    ['liverpool','reds'],
    psg:          ['psg','paris saint germain','paris'],
    // Seleções Copa 2026
    brasil:       ['brasil','brazil','selecao','verde amarela','canarinha'],
    argentina:    ['argentina','albiceleste'],
    franca:       ['franca','france','les bleus'],
    alemanha:     ['alemanha','germany','mannschaft'],
    portugal:     ['portugal','selecao portuguesa','cristiano'],
  };
  for (const [key,aliases] of Object.entries(mapa)) {
    if (aliases.some(a=>t.includes(normalizar(a)))) return key;
  }
  return null;
}
function verificarIA(texto) {
  const t = normalizar(texto);
  for (const r of AI_RESPOSTAS) {
    if (r.palavras.some(p=>t.includes(p))) return r.texto;
  }
  return null;
}
function getTime() { return new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}); }
function getTodayLabel() { return new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'2-digit',month:'long'}); }
function formatText(raw) {
  return raw.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/\*([^*\n]+)\*/g,'<strong>$1</strong>').replace(/_([^_\n]+)_/g,'<em>$1</em>');
}
function scrollToBottom() { requestAnimationFrame(()=>{ chatWrap.scrollTop=chatWrap.scrollHeight; }); }
function setBadge(n) {
  if (!sidebarBadge) return;
  n>0 ? (sidebarBadge.textContent=n>99?'99+':n, sidebarBadge.style.display='flex') : sidebarBadge.style.display='none';
}
function updateSidebar(txt) {
  if (sidebarTime) sidebarTime.textContent = getTime();
  if (sidebarPreview&&txt) sidebarPreview.textContent = txt.replace(/\*|_/g,'').split('\n')[0].substring(0,40)+'...';
}
function showToast(msg,dur) {
  if (!toast) return;
  toast.textContent=msg; toast.classList.add('show');
  setTimeout(()=>toast.classList.remove('show'),dur||3500);
}

// ================================================================
// BOTÃO VOLTAR
// ================================================================
function showBackButton() {
  const old = document.getElementById('back-btn-row');
  if (old) old.remove();
  if (currentStep < 1 || stepHistory.length < 1) return;
  const row = document.createElement('div');
  row.id = 'back-btn-row';
  const btn = document.createElement('button');
  btn.id = 'back-btn';
  btn.innerHTML = '← Voltar';
  btn.addEventListener('click', ()=>{ if(!isBotTyping) goBack(); });
  row.appendChild(btn);
  messagesContainer.insertBefore(row, typingIndicator);
  scrollToBottom();
}
function hideBackButton() {
  const el = document.getElementById('back-btn-row');
  if (el) el.remove();
}
function goBack() {
  if (stepHistory.length === 0) return;
  const prev = stepHistory.pop();

  // Restaurar estado anterior
  currentStep        = prev.step;
  teamDetected       = prev.teamDetected;
  Object.assign(lead, prev.lead);

  // Remover mensagens que apareceram depois do ponto salvo
  const all = messagesContainer.querySelectorAll('.msg-row');
  for (let i = all.length - 1; i >= prev.msgCount; i--) all[i]?.remove();

  // Limpar UI
  hideBackButton();
  optionsArea.innerHTML = '';
  optionsArea.classList.add('hidden');
  msgInput.disabled = true;
  sendBtn.disabled  = true;
  msgInput.value    = '';
  msgInput.style.height = '';
  msgInput.placeholder  = 'Digite sua mensagem...';
  hideTyping();

  // Re-executar step sem adicionar ao histórico novamente
  _runStepNoHistory(currentStep);
}

// Versão de runStep que NÃO salva no histórico (usada pelo goBack)
function _runStepNoHistory(index) {
  if (isBotTyping) return;
  const step  = steps[index];
  const delay = 1400 + Math.random() * 700;
  isBotTyping = true; showTyping();

  setTimeout(async () => {
    isBotTyping = false; hideTyping();
    addMessage(step.text, 'bot');

    if (index === 2 && teamDetected) {
      const time = TIMES[teamDetected];
      const ehSelecao = ['brasil','argentina','franca','alemanha','portugal'].includes(teamDetected);
      await new Promise(r=>setTimeout(r,600));
      addImageMessage(time.img, time.nome);
      await new Promise(r=>setTimeout(r,1200));
      isBotTyping=true; showTyping();
      await new Promise(r=>setTimeout(r,1300));
      isBotTyping=false; hideTyping();
      const msgCamisa = ehSelecao
        ? `Essa é a camisa oficial da *${time.nome}* para a *Copa do Mundo 2026*! 🌍🏆\n\nTemos edição titular e reserva disponíveis.`
        : `Essa é uma das camisas mais pedidas aqui na loja! 🔥\n\nPosso consultar a disponibilidade dessa edição nos modelo titular e reserva para você!`;
      addMessage(msgCamisa,'bot');
      await new Promise(r=>setTimeout(r,800));
      isBotTyping=true; showTyping();
      await new Promise(r=>setTimeout(r,1200));
      isBotTyping=false; hideTyping();
      addMessage(`É essa camisa que você procura ou está pensando em algum outro modelo? 👇`,'bot');
      if (index>0) showBackButton();
      showOptions(
        [`✅ É essa, quero essa!`,`🔄 Quero outro modelo`],
        ['opt-primary','opt-secondary'],
        (val)=>{
          if (val.includes('outro')) {
            isBotTyping=true; showTyping();
            setTimeout(()=>{
              isBotTyping=false; hideTyping();
              addMessage('Claro! Qual camisa ou time você está procurando? 😊','bot');
              enableInput('Ex: Liverpool, Portugal, Grêmio...','text',(novoTime)=>{
                lead.produto=novoTime;
                const nd=detectarTime(novoTime);
                if (nd) {
                  teamDetected=nd;
                  const nto=TIMES[nd];
                  isBotTyping=true; showTyping();
                  setTimeout(async ()=>{
                    isBotTyping=false; hideTyping();
                    addMessage(`Ótima escolha! 🔥\n\nOlha a camisa do *${nto.nome}*:`,'bot');
                    await new Promise(r=>setTimeout(r,500));
                    addImageMessage(nto.img,nto.nome);
                    await new Promise(r=>setTimeout(r,1000));
                    isBotTyping=true; showTyping();
                    await new Promise(r=>setTimeout(r,1200));
                    isBotTyping=false; hideTyping();
                    addMessage('Perfeito! Agora me conta, como posso te chamar? 😊','bot');
                    if (index>0) showBackButton();
                    enableInput('Digite seu nome...','text',(nome)=>{ lead.nome=nome; advanceStep(); });
                  },1400);
                } else {
                  teamDetected=null;
                  isBotTyping=true; showTyping();
                  setTimeout(()=>{
                    isBotTyping=false; hideTyping();
                    addMessage('Anotado! Vou verificar essa camisa para você. 📝\n\nComo posso te chamar?','bot');
                    if (index>0) showBackButton();
                    enableInput('Digite seu nome...','text',(nome)=>{ lead.nome=nome; advanceStep(); });
                  },1400);
                }
              });
            },1200);
          } else {
            isBotTyping=true; showTyping();
            setTimeout(()=>{
              isBotTyping=false; hideTyping();
              addMessage('Ótimo! Vou verificar a disponibilidade para você. 🙌\n\nComo posso te chamar?','bot');
              if (index>0) showBackButton();
              enableInput('Digite seu nome...','text',(nome)=>{ lead.nome=nome; advanceStep(); });
            },1400);
          }
        }
      );
      return;
    }

    if (step.final) { hideBackButton(); finalizeLead(); return; }
    if (index > 0) showBackButton();
    if (step.options) showOptions(step.options, step.optClasses || null, step.onOption.bind(step));
    else if (step.input) enableInput(step.placeholder, step.inputType, step.onInput.bind(step));
  }, delay);
}

// ================================================================
// MENSAGENS
// ================================================================
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
  if (type==='bot') {
    const check = document.createElement('span');
    check.className='msg-check read'; check.setAttribute('aria-hidden','true'); check.innerHTML='✓✓';
    meta.appendChild(check);
    badgeCount++; setBadge(badgeCount); updateSidebar(text);
  }
  bubble.appendChild(textEl); bubble.appendChild(meta); row.appendChild(bubble);
  messagesContainer.insertBefore(row, typingIndicator);
  scrollToBottom();
}

function addImageMessage(imgSrc, altText) {
  typingIndicator.classList.remove('visible');
  const row    = document.createElement('div'); row.className='msg-row bot';
  const bubble = document.createElement('div'); bubble.className='msg-bubble img-bubble';
  const img    = document.createElement('img');
  img.className='chat-img'; img.alt=altText||'Camisa'; img.loading='lazy';
  img.onerror = function() {
    const ph=document.createElement('div'); ph.className='chat-img-placeholder';
    ph.textContent='⚽ '+(altText||'Camisa'); bubble.replaceChild(ph,img);
  };
  img.src=imgSrc;
  const meta=document.createElement('div'); meta.className='msg-meta';
  const timeEl=document.createElement('span'); timeEl.className='msg-time'; timeEl.textContent=getTime();
  const check=document.createElement('span'); check.className='msg-check read'; check.setAttribute('aria-hidden','true'); check.innerHTML='✓✓';
  meta.appendChild(timeEl); meta.appendChild(check);
  bubble.appendChild(img); bubble.appendChild(meta); row.appendChild(bubble);
  messagesContainer.insertBefore(row, typingIndicator);
  badgeCount++; setBadge(badgeCount); scrollToBottom();
}

function addSocialButtons() {
  const row=document.createElement('div'); row.className='msg-row bot';
  const bubble=document.createElement('div'); bubble.className='msg-bubble';
  bubble.style.maxWidth='85%'; bubble.style.paddingBottom='10px';
  const textEl=document.createElement('div'); textEl.className='msg-text';
  textEl.innerHTML=formatText('Muitas novidades e modelos novos de camisas aparecem primeiro por lá! 👀');
  bubble.appendChild(textEl);
  const btns=document.createElement('div'); btns.className='social-btns';
  const ig=document.createElement('a');
  ig.href='https://instagram.com/rfootball.store'; ig.target='_blank'; ig.rel='noopener noreferrer';
  ig.className='social-btn instagram';
  ig.innerHTML=`<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg> Seguir no Instagram`;
  const fb=document.createElement('a');
  fb.href='https://facebook.com/rfootballstore'; fb.target='_blank'; fb.rel='noopener noreferrer';
  fb.className='social-btn facebook';
  fb.innerHTML=`<svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg> Seguir no Facebook`;
  btns.appendChild(ig); btns.appendChild(fb); bubble.appendChild(btns);
  const meta=document.createElement('div'); meta.className='msg-meta';
  meta.style.cssText='position:relative;margin-top:8px;';
  const timeEl=document.createElement('span'); timeEl.className='msg-time';
  timeEl.style.cssText='color:#8696a0;font-size:11px;'; timeEl.textContent=getTime();
  meta.appendChild(timeEl); bubble.appendChild(meta); row.appendChild(bubble);
  messagesContainer.insertBefore(row, typingIndicator);
  badgeCount++; setBadge(badgeCount); scrollToBottom();
}

// ================================================================
// TYPING / OPÇÕES / INPUT
// ================================================================
function showTyping() { typingIndicator.classList.add('visible');    scrollToBottom(); }
function hideTyping() { typingIndicator.classList.remove('visible'); }

function showOptions(options, optClasses, callback) {
  optionsArea.innerHTML=''; optionsArea.classList.remove('hidden');
  options.forEach((opt,i)=>{
    const btn=document.createElement('button');
    btn.className='opt-btn '+(optClasses&&optClasses[i] ? optClasses[i] : 'opt-primary');
    btn.textContent=opt; btn.type='button';
    btn.addEventListener('click',()=>{
      optionsArea.querySelectorAll('.opt-btn').forEach(b=>b.disabled=true);
      addMessage(opt,'user');
      optionsArea.classList.add('hidden');
      badgeCount=0; setBadge(0);
      callback(opt);
    });
    optionsArea.appendChild(btn);
  });
  scrollToBottom();
}

function enableInput(placeholder, inputType, callback) {
  msgInput.placeholder=placeholder||'Digite sua mensagem...';
  msgInput.setAttribute('inputmode',inputType==='tel'?'tel':inputType==='email'?'email':'text');
  if (inputType==='tel')   msgInput.setAttribute('autocomplete','tel');
  if (inputType==='email') msgInput.setAttribute('autocomplete','email');
  if (inputType==='text')  msgInput.setAttribute('autocomplete','off');
  msgInput.disabled=false; sendBtn.disabled=false;
  setTimeout(()=>msgInput.focus(),100);
  msgInput.onkeydown=null; sendBtn.onclick=null;

  function submit() {
    const val=msgInput.value.trim();
    if (!val) { msgInput.style.border='1.5px solid #e74c3c'; setTimeout(()=>msgInput.style.border='',1200); return; }
    // IA no step 1 para dúvidas/assunto
    if (currentStep===1 && !lead.interesse.includes('comprar')) {
      const iaResp=verificarIA(val);
      if (iaResp) {
        msgInput.disabled=true; sendBtn.disabled=true;
        msgInput.value=''; msgInput.style.height='';
        addMessage(val,'user'); badgeCount=0; setBadge(0);
        lead.assunto=val;
        isBotTyping=true; showTyping();
        setTimeout(()=>{ isBotTyping=false; hideTyping(); addMessage(iaResp,'bot'); setTimeout(()=>callback(val),800); }, 1300+Math.random()*500);
        return;
      }
    }
    msgInput.disabled=true; sendBtn.disabled=true;
    msgInput.value=''; msgInput.style.height='';
    msgInput.removeAttribute('autocomplete'); msgInput.removeAttribute('inputmode');
    addMessage(val,'user'); badgeCount=0; setBadge(0);
    callback(val);
  }
  msgInput.onkeydown=(e)=>{ if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();submit();} };
  sendBtn.onclick=submit;
  msgInput.oninput=()=>{ msgInput.style.height='auto'; msgInput.style.height=Math.min(msgInput.scrollHeight,120)+'px'; };
}

// ================================================================
// CONTROLE DE STEPS
// ================================================================
function advanceStep() {
  // Salva estado atual ANTES de avançar — para poder voltar corretamente
  stepHistory.push({
    step:        currentStep,
    teamDetected,
    msgCount:    messagesContainer.querySelectorAll('.msg-row').length,
    lead:        { ...lead }
  });
  currentStep++;
  if (currentStep < steps.length) runStep(currentStep);
}

function runStep(index) {
  if (isBotTyping) return;
  const step=steps[index];
  const delay=1400+Math.random()*700;

  isBotTyping=true; showTyping();

  setTimeout(async ()=>{
    isBotTyping=false; hideTyping();
    addMessage(step.text,'bot');

    if (index===2 && teamDetected) {
      const time = TIMES[teamDetected];
      const ehSelecao = ['brasil','argentina','franca','alemanha','portugal'].includes(teamDetected);

      await new Promise(r=>setTimeout(r,600));
      addImageMessage(time.img, time.nome);
      await new Promise(r=>setTimeout(r,1200));

      // Mensagem sobre a camisa
      isBotTyping=true; showTyping();
      await new Promise(r=>setTimeout(r,1300));
      isBotTyping=false; hideTyping();

      const msgCamisa = ehSelecao
        ? `Essa é a camisa oficial da *${time.nome}* para a *Copa do Mundo 2026*! 🌍🏆\n\nPosso consultar a disponibilidade dessa edição nos modelo titular e reserva para você!`
        : `Essa é uma das camisas mais pedidas aqui na loja! 🔥\n\nPosso consultar a disponibilidade dessa edição nos modelo titular e reserva para você!`;
      addMessage(msgCamisa, 'bot');

      await new Promise(r=>setTimeout(r,800));

      // Pergunta de confirmação — é essa ou outro modelo?
      isBotTyping=true; showTyping();
      await new Promise(r=>setTimeout(r,1200));
      isBotTyping=false; hideTyping();
      addMessage(`É essa camisa que você procura ou está pensando em algum outro modelo? 👇`, 'bot');

      if (index>0) showBackButton();
      showOptions(
        [`✅ É essa, quero essa!`, `🔄 Quero outro modelo`],
        ['opt-primary','opt-secondary'],
        (val) => {
          if (val.includes('outro')) {
            // Deixar digitar outro time
            isBotTyping=true; showTyping();
            setTimeout(()=>{
              isBotTyping=false; hideTyping();
              addMessage('Claro! Qual camisa ou time você está procurando? 😊','bot');
              enableInput('Ex: Liverpool, Portugal, Grêmio...','text',(novoTime)=>{
                lead.produto = novoTime;
                const novoDetectado = detectarTime(novoTime);
                if (novoDetectado) {
                  teamDetected = novoDetectado;
                  const novoTimeObj = TIMES[novoDetectado];
                  isBotTyping=true; showTyping();
                  setTimeout(async ()=>{
                    isBotTyping=false; hideTyping();
                    addMessage(`Ótima escolha! 🔥\n\nOlha a camisa do *${novoTimeObj.nome}*:`,'bot');
                    await new Promise(r=>setTimeout(r,500));
                    addImageMessage(novoTimeObj.img, novoTimeObj.nome);
                    await new Promise(r=>setTimeout(r,1000));
                    isBotTyping=true; showTyping();
                    await new Promise(r=>setTimeout(r,1200));
                    isBotTyping=false; hideTyping();
                    addMessage('Perfeito! Agora me conta, como posso te chamar? 😊','bot');
                    if (index>0) showBackButton();
                    enableInput('Digite seu nome...','text',(nome)=>{ lead.nome=nome; advanceStep(); });
                  },1400);
                } else {
                  // Time não identificado — seguir normalmente
                  teamDetected = null;
                  isBotTyping=true; showTyping();
                  setTimeout(()=>{
                    isBotTyping=false; hideTyping();
                    addMessage('Anotado! Vou verificar essa camisa para você. 📝\n\nComo posso te chamar?','bot');
                    if (index>0) showBackButton();
                    enableInput('Digite seu nome...','text',(nome)=>{ lead.nome=nome; advanceStep(); });
                  },1400);
                }
              });
            },1200);
          } else {
            // Confirma a camisa atual — continua para o nome
            isBotTyping=true; showTyping();
            setTimeout(()=>{
              isBotTyping=false; hideTyping();
              addMessage('Ótimo! Vou verificar a disponibilidade para você. 🙌\n\nComo posso te chamar?','bot');
              if (index>0) showBackButton();
              enableInput('Digite seu nome...','text',(nome)=>{ lead.nome=nome; advanceStep(); });
            },1400);
          }
        }
      );
      return; // Não executa o fluxo padrão abaixo
    }

    if (step.final) { hideBackButton(); finalizeLead(); setTimeout(()=>{ isBotTyping=true; showTyping(); setTimeout(()=>{ isBotTyping=false; hideTyping(); addSocialButtons(); },1500); },1000); return; }

    if (index>0) showBackButton();

    if (step.options) showOptions(step.options, step.optClasses||null, step.onOption.bind(step));
    else if (step.input) enableInput(step.placeholder, step.inputType, step.onInput.bind(step));
  }, delay);
}

// ================================================================
// FINALIZAR / ENVIAR
// ================================================================
function finalizeLead() {
  lead.data=new Date().toISOString();
  msgInput.disabled=true; sendBtn.disabled=true;
  msgInput.placeholder='Conversa encerrada ✓';
  optionsArea.classList.add('hidden');
  sendLead({...lead});
}

async function sendLead(data) {
  try {
    const res=await fetch('/api/salvarLead',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const result=await res.json();
    if (result.success) { console.log('✅ Lead salvo:',result); showToast('✅ Mensagem recebida! Entraremos em contato em breve.',4000); }
    else throw new Error(result.message);
  } catch(err) {
    console.warn('⚠️ Erro:',err.message);
    showToast('✅ Solicitação registrada! Em breve entraremos em contato.',4000);
  }
}

// ================================================================
// TECLADO MOBILE
// ================================================================
function setupMobileKeyboard() {
  if (!window.visualViewport) return;
  window.visualViewport.addEventListener('resize',()=>{ document.getElementById('app').style.height=window.visualViewport.height+'px'; scrollToBottom(); });
  msgInput.addEventListener('focus',()=>{ setTimeout(()=>scrollToBottom(),300); });
}

// ================================================================
// INIT
// ================================================================
function init() {
  dateLabel.textContent=getTodayLabel(); setBadge(0);
  if (proofCount) proofCount.textContent=(Math.floor(Math.random()*(1500-800+1))+800).toLocaleString('pt-BR');
  setupMobileKeyboard();
  setTimeout(()=>{ joinMsg.style.display='block'; scrollToBottom(); setTimeout(()=>runStep(0),1000); },600);
}

if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',init);
else init();
