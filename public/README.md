# RFootball Store — Deploy na Vercel

## ⚠️ Configuração importante no Vercel

Ao importar o repositório na Vercel, **deixe o campo "Root Directory" em BRANCO**.

> Não preencha "public" nem nada — a raiz do projeto já É a pasta correta.

---

## Estrutura do projeto

```
/ (raiz)
├── index.html        ← página principal
├── style.css
├── script.js
├── vercel.json       ← configuração do Vercel
├── package.json
├── img/              ← coloque as fotos das camisas aqui
│   ├── flamengo.jpg
│   ├── corinthians.jpg
│   └── ...
└── api/
    └── salvarLead.js ← serverless function (envia e-mail via Resend)
```

---

## Variáveis de ambiente (Vercel → Settings → Environment Variables)

| Nome             | Valor                        |
|------------------|------------------------------|
| RESEND_API_KEY   | re_xxxxxxxxxxxxxxxxxxxx       |
| EMAIL_DESTINO    | seu@email.com                |

---

## Imagens das camisas

Coloque na pasta `/img/` com estes nomes exatos:
`flamengo.jpg`, `corinthians.jpg`, `palmeiras.jpg`, `saopaulo.jpg`,
`santos.jpg`, `vasco.jpg`, `gremio.jpg`, `internacional.jpg`,
`atletico.jpg`, `cruzeiro.jpg`, `fluminense.jpg`, `botafogo.jpg`,
`bahia.jpg`, `fortaleza.jpg`, `athletico.jpg`

Tamanho recomendado: 400×300px, máx 80kb cada.
