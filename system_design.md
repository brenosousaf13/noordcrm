# Noord CRM — System Design

> Documento de referência visual e de design system para o agente Antigravity. Deve ser lido antes de criar ou modificar qualquer componente da interface.

---

## 1. Filosofia de Design

O Noord CRM segue uma estética **clean, funcional e profissional** — um dashboard de trabalho real, sem ornamentos desnecessários. A interface deve transmitir **clareza e confiança**: cada elemento existe por uma razão, cada pixel carrega informação. Inspiração direta: ferramentas SaaS modernas de alto nível (Linear, Notion, Vercel dashboard).

**Princípios:**
- Hierarquia visual clara: o olho sabe exatamente onde ir
- Densidade controlada: informação suficiente sem sufocamento
- Consistência absoluta: mesmos espaçamentos, mesmos raios de borda, mesmos pesos tipográficos em situações equivalentes
- Interações sutis: hover states, transições, feedback visual — tudo com timing elegante

---

## 2. Paleta de Cores

### Base (Light Mode — padrão)

| Token | Hex | Uso |
|---|---|---|
| `--bg-app` | `#F0F2F5` | Fundo geral da aplicação |
| `--bg-surface` | `#FFFFFF` | Cards, painéis, modais |
| `--bg-surface-raised` | `#F8F9FA` | Hover de linhas, inputs |
| `--border` | `#E4E7EC` | Divisores, bordas de cards |
| `--border-strong` | `#CBD2DA` | Bordas de inputs focados |

### Texto

| Token | Hex | Uso |
|---|---|---|
| `--text-primary` | `#111827` | Títulos, dados principais |
| `--text-secondary` | `#6B7280` | Labels, metadados, subítulos |
| `--text-tertiary` | `#9CA3AF` | Placeholders, texto desabilitado |

### Acento Principal — Verde Noord

| Token | Hex | Uso |
|---|---|---|
| `--accent` | `#1A9E6E` | Elementos ativos, CTAs primários, ícones de navegação ativos |
| `--accent-light` | `#E8F7F1` | Background de item ativo no menu, badges de status positivo |
| `--accent-hover` | `#158A5E` | Hover de botões primários |

### Feedback

| Token | Hex | Uso |
|---|---|---|
| `--red` | `#EF4444` | Prioridade alta, erros, tendência negativa |
| `--orange` | `#F97316` | Prioridade média, avisos |
| `--yellow` | `#EAB308` | Alertas suaves |
| `--blue` | `#3B82F6` | Informações, links |
| `--gray-muted` | `#D1D5DB` | Prioridade baixa, itens desabilitados |

### Cores de Clientes (paleta dinâmica)
Cada cliente recebe automaticamente uma cor da lista abaixo (em ordem de cadastro):

```
#1A9E6E  →  verde noord (padrão)
#3B82F6  →  azul
#8B5CF6  →  violeta
#F97316  →  laranja
#EC4899  →  rosa
#14B8A6  →  teal
#EAB308  →  âmbar
#6366F1  →  índigo
```

Essas cores são usadas na **linha lateral dos cards de tarefa** e nas **abas de cliente**.

---

## 3. Tipografia

### Fontes

| Papel | Fonte | Import |
|---|---|---|
| Display / Títulos de seção | `Syne` | Google Fonts |
| Interface / Corpo | `DM Sans` | Google Fonts |
| Dados / Metadados / Tempo | `DM Mono` | Google Fonts |

```html
<!-- No index.html -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@600;700&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
```

### Escala Tipográfica

| Token | Fonte | Tamanho | Peso | Uso |
|---|---|---|---|---|
| `text-display` | Syne | 22px | 700 | Título de página ("Sala de Comando") |
| `text-section` | Syne | 14px | 600 | Títulos de seção (TAREFAS, AGENDA) |
| `text-body-lg` | DM Sans | 14px | 500 | Título de card, nome de cliente |
| `text-body` | DM Sans | 13px | 400 | Corpo geral, labels |
| `text-small` | DM Sans | 12px | 400 | Metadados secundários |
| `text-mono` | DM Mono | 12px | 500 | Tempo estimado, datas, IDs |
| `text-label` | DM Sans | 11px | 600 | Labels de categoria, badges |

---

## 4. Espaçamento e Grid

Usar escala de **4px base**:

| Token | Valor | Uso |
|---|---|---|
| `space-1` | 4px | Espaços internos mínimos |
| `space-2` | 8px | Padding interno de badges |
| `space-3` | 12px | Gap entre ícone e texto no menu |
| `space-4` | 16px | Padding padrão de cards |
| `space-5` | 20px | Padding de seções |
| `space-6` | 24px | Gap entre cards |
| `space-8` | 32px | Padding de painéis maiores |

### Border Radius

| Token | Valor | Uso |
|---|---|---|
| `radius-sm` | 6px | Badges, tags |
| `radius-md` | 10px | Cards, inputs |
| `radius-lg` | 14px | Modais, painéis |
| `radius-xl` | 20px | Menu lateral (borda do app) |

---

## 5. Sombras

```css
--shadow-card:   0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
--shadow-raised: 0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04);
--shadow-modal:  0 20px 60px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06);
```

Cards em estado normal: `--shadow-card`  
Cards em hover/drag: `--shadow-raised`  
Modais e drawers: `--shadow-modal`

---

## 6. Componentes Base

### 6.1 Menu Lateral

```
Largura colapsada:  64px
Largura expandida: 220px
Background: #FFFFFF
Border-right: 1px solid var(--border)
Transição: width 200ms ease

Item ativo:
  background: var(--accent-light)
  cor do ícone: var(--accent)
  font-weight: 600

Item inativo:
  ícone: var(--text-secondary)
  hover background: var(--bg-surface-raised)
```

### 6.2 Cards de Tarefa

```
Background: var(--bg-surface)
Border: 1px solid var(--border)
Border-radius: var(--radius-md)
Padding: 12px 14px 12px 16px
Shadow: var(--shadow-card)

Linha lateral:
  width: 3px
  border-radius: 3px 0 0 3px
  cor: definida pela cor do cliente

Hover:
  shadow: var(--shadow-raised)
  transform: translateY(-1px)
  transition: all 150ms ease

Dragging:
  shadow: var(--shadow-modal)
  transform: rotate(1.5deg) scale(1.02)
  opacity: 0.95
```

**Indicador de Prioridade (3 tracinhos):**
```
Alta:   3 tracinhos — cor: var(--red)     — largura: 14px / 10px / 6px
Média:  2 tracinhos — cor: var(--orange)  — largura: 14px / 10px
Baixa:  1 tracinho  — cor: var(--gray-muted) — largura: 14px
```

**Altura do card por tempo estimado:**
```
Base (60 min)  → min-height: 80px
+30 min        → +20px
Fórmula: height = 80 + Math.floor((minutos - 60) / 30) * 20
```

### 6.3 Abas (Tabs)

```
Background ativa: var(--accent)   |  texto: #FFFFFF
Background inativa: transparente  |  texto: var(--text-secondary)
Hover inativa: var(--bg-surface-raised)
Border-radius: var(--radius-sm)
Font: DM Sans 12px 600
Padding: 4px 10px
```

### 6.4 Botões

**Primário:**
```
Background: var(--accent)
Text: #FFFFFF
Padding: 8px 16px
Border-radius: var(--radius-sm)
Font: DM Sans 13px 600
Hover: var(--accent-hover)
```

**Secundário:**
```
Background: var(--bg-surface)
Border: 1px solid var(--border)
Text: var(--text-primary)
Hover: var(--bg-surface-raised)
```

**Ghost / Icon button:**
```
Background: transparente
Hover: var(--bg-surface-raised)
Border-radius: var(--radius-sm)
Padding: 6px
```

### 6.5 Inputs

```
Height: 36px
Background: var(--bg-surface)
Border: 1px solid var(--border)
Border-radius: var(--radius-md)
Padding: 0 12px
Font: DM Sans 13px 400
Color: var(--text-primary)
Placeholder: var(--text-tertiary)

Focus:
  border-color: var(--accent)
  box-shadow: 0 0 0 3px rgba(26,158,110,0.12)
  outline: none
```

### 6.6 Badges / Tags

```
Border-radius: var(--radius-sm)
Padding: 2px 8px
Font: DM Sans 11px 600
Letter-spacing: 0.02em

Status ativo/positivo: background var(--accent-light), color var(--accent)
Status alerta: background #FEF3C7, color #92400E
Status erro: background #FEE2E2, color #991B1B
```

---

## 7. Estrutura Visual das Seções

### Cabeçalho de Seção (padrão)

```
┌──────────────────────────────────────────────┐
│ [ÍCONE] TÍTULO DA SEÇÃO     [ação dir.]  [+] │
│ ──────────────────────────────────────────── │
│  [aba1] [aba2] [aba3]          [filtros] [↓] │
└──────────────────────────────────────────────┘
```

- Título em `text-section` (Syne 14px 600), uppercase, `var(--text-secondary)`
- Linha divisória: `1px solid var(--border)`
- Espaçamento interno: `16px`

### Fundo do App

Usar `var(--bg-app)` (`#F0F2F5`) como fundo base, criando contraste visual com os painéis brancos — efeito de "cards flutuando" sobre o fundo, como nas referências enviadas.

---

## 8. Animações e Transições

```css
/* Transição padrão para hover states */
transition: all 150ms ease;

/* Abertura de drawers/modais */
transition: transform 220ms cubic-bezier(0.34, 1.56, 0.64, 1);

/* Fade in de conteúdo */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Cards entrando na lista */
@keyframes slideIn {
  from { opacity: 0; transform: translateX(-8px); }
  to   { opacity: 1; transform: translateX(0); }
}
```

Regras:
- Nenhuma animação acima de `300ms`
- Preferir `ease` ou `cubic-bezier` sobre `linear`
- Drag & drop: feedback imediato, sem delay

---

## 9. Ícones

Usar exclusivamente **Lucide React**. Tamanho padrão: `16px`. Stroke width: `1.5`.

Ícones sugeridos por seção:
```
Home/Dashboard  → LayoutDashboard
Clientes        → Users
Tarefas         → CheckSquare
Notas           → FileText
Agenda          → CalendarDays
Perfil          → CircleUser
Logout          → LogOut
Nova tarefa     → Plus
Filtro          → SlidersHorizontal
Ordenar         → ArrowUpDown
Busca           → Search
Seta nav        → ChevronLeft / ChevronRight
```

---

## 10. Checklist de Qualidade Visual

Antes de entregar qualquer componente, verificar:

- [ ] Fontes corretas (Syne, DM Sans, DM Mono) — nunca Inter, Roboto, Arial
- [ ] Cores usando tokens CSS (`var(--accent)`, etc.), nunca hardcoded
- [ ] Hover state em todos os elementos interativos
- [ ] Borda lateral colorida nos cards de tarefa
- [ ] Sombras corretas por nível (`card` / `raised` / `modal`)
- [ ] Fundo `#F0F2F5` no app com painéis `#FFFFFF` em contraste
- [ ] Espaçamentos múltiplos de 4px
- [ ] Nenhum gradiente genérico ou roxo
- [ ] Ícones Lucide com `strokeWidth={1.5}`
- [ ] Transições suaves em interações

---

*System Design — Noord CRM | noordshop*