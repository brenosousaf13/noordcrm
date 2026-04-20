# Noord CRM — System Prompt de Desenvolvimento (Etapa 1)

> Este documento orienta o agente Antigravity no desenvolvimento da primeira etapa do Noord CRM, um sistema de gestão interno da noordshop. Leia-o integralmente antes de escrever qualquer linha de código.

---

## 1. Visão Geral do Projeto

O Noord CRM é uma aplicação web de uso interno para gerenciar clientes, tarefas e notas de forma integrada, em um único painel. Será acessado por até 3 usuários autenticados. O backend é Supabase (PostgreSQL + Auth + Realtime).

---

## 2. Stack Obrigatória

| Camada | Tecnologia |
|---|---|
| Framework | React (Vite) |
| Linguagem | TypeScript |
| Estilização | Tailwind CSS |
| Backend / DB | Supabase |
| Autenticação | Supabase Auth (email + senha) |
| Drag & Drop | @dnd-kit/core |
| Editor de Notas | Tiptap (extensões: Bold, Italic, BulletList, Color, Heading) |
| Ícones | Lucide React |
| Deploy | Vercel |

---

## 3. Skills Obrigatórias

**SEMPRE** ative a skill `frontend-design` antes de criar ou modificar qualquer componente visual. O design deve ser:

- **Tema**: dark mode refinado, paleta fria com um único acento vívido (sugestão: verde-menta `#4FFFB0` ou âmbar `#FFB347`)
- **Tipografia**: fonte display diferenciada para títulos (ex: `DM Serif Display`, `Syne`, ou `Fraunces`) + fonte mono para metadados de tempo/data (ex: `JetBrains Mono`)
- **Layout**: denso e funcional, sem espaços em branco excessivos — cada pixel deve trabalhar
- **Cards de Tarefa**: devem ter personalidade visual forte; a linha lateral colorida por cliente é identidade do sistema
- **Evitar**: Inter, Roboto, cores roxas, gradientes genéricos, sombras padrão do Tailwind

---

## 4. Estrutura de Rotas

```
/login          → Tela de autenticação
/               → Página Home ("Sala de Comando") — rota protegida
```

Todas as rotas exceto `/login` devem exigir sessão ativa no Supabase. Redirecionar para `/login` se não autenticado.

---

## 5. Schema do Banco de Dados (Supabase)

Execute as migrações abaixo em ordem. Habilite RLS em todas as tabelas.

```sql
-- Clientes
create table clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  color text not null default '#888888', -- cor hex para identificação visual
  created_at timestamptz default now()
);

-- Tarefas
create table tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  client_id uuid references clients(id) on delete set null,
  estimated_minutes integer not null default 60,
  deadline date,
  priority smallint not null default 2 check (priority in (1,2,3)), -- 1=alta 2=média 3=baixa
  is_done boolean not null default false,
  scheduled_at timestamptz,   -- null = não alocada na agenda
  created_at timestamptz default now()
);

-- Notas
create table notes (
  id uuid primary key default gen_random_uuid(),
  title text not null default 'Sem título',
  content jsonb,              -- conteúdo Tiptap serializado em JSON
  client_id uuid references clients(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

Políticas RLS: todos os usuários autenticados podem SELECT, INSERT, UPDATE, DELETE em todas as tabelas (equipe interna).

```sql
-- Exemplo para tasks (replicar para clients e notes)
alter table tasks enable row level security;
create policy "authenticated users full access"
  on tasks for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
```

---

## 6. Layout da Página Home ("Sala de Comando")

```
┌──────────┬───────────────────────────────────────────────────────┐
│          │  SALA DE COMANDO                                      │
│  MENU    ├─────────────────────────┬─────────────────────────────┤
│  (nav    │  AGENDA (verde)         │                             │
│  lateral │  Semana Seg–Sex         │  NOTAS (azul)               │
│  rosa)   │  Grid horário           │  Aba Home + notas abertas   │
│          ├─────────────────────────┤                             │
│          │  TAREFAS (amarelo)      │                             │
│          │  Kanban / lista cards   │                             │
└──────────┴─────────────────────────┴─────────────────────────────┘
```

Proporções sugeridas (CSS Grid):
- Menu: `60px` (colapsado) ou `200px` (expandido)
- Coluna esquerda (Agenda + Tarefas): `~55%`
- Coluna direita (Notas): `~45%`
- Agenda: `~35%` da altura total; Tarefas: `~65%`

---

## 7. Componentes e Comportamento

### 7.1 Menu (nav lateral)

- Ícone + label abaixo: Home, Clientes, Tarefas, Notas
- Item **Clientes**: ao hover, abre painel lateral deslizante com lista de clientes + botão "Novo Cliente"
- Rodapé do menu: avatar/botão de perfil do usuário logado (nome + logout)

### 7.2 Área Tarefas

- **Abas**: "Todas" (fixa) + uma aba por cliente (criada dinamicamente)
- **Filtro/Ordenador** (canto superior direito):
  - Ordenar por data
  - Filtrar por data: campo calendário + atalhos "Hoje", "Amanhã", "Esta semana"
  - Toggle: mostrar/ocultar tarefas já alocadas na agenda
- **Cards de Tarefa**:
  - Linha colorida lateral = cor do cliente
  - Altura proporcional ao `estimated_minutes` (base: 60min → 80px; cada 30min extras → +24px)
  - Conteúdo: Título (destaque), Cliente (abaixo), Tempo Estimado (ao lado do título), Data Limite (canto superior direito), Indicador de Prioridade (3 tracinhos coloridos: vermelho=alta, laranja=média, cinza=baixa)
  - Quando `is_done = true`: card acinzentado/opacidade reduzida
  - Drag para Agenda: define `scheduled_at`; o card some da lista (a menos que o toggle "mostrar alocadas" esteja ativo)
- **Botão "Nova Tarefa"** (canto inferior esquerdo): abre modal/drawer

### 7.3 Área Notas

- **Aba "Home"**: lista todas as notas (Título + Cliente) + campo de busca
- **Abas dinâmicas**: cada nota aberta vira uma aba (máx 4 abertas simultaneamente)
- **Botão "+"** (canto superior direito): cria nova nota em branco e abre sua aba
- **Editor**: Tiptap com barra de ferramentas (Bold, Italic, H1/H2, Lista, Cor do texto)
  - Abaixo do título: selector opcional de cliente
  - Salvamento automático com debounce de 1s (atualiza `updated_at`)

### 7.4 Área Agenda

- Janela semanal Seg–Sex
- Grid de horas (7h–20h) com linhas discretas
- Navegação de semana: botões `<` `>` no canto superior direito
- Cards arrastados da área Tarefas são posicionados na Agenda (definem `scheduled_at`)
- Cards podem ser arrastados dentro da Agenda para reposicionamento
- Altura do card na Agenda = proporcional ao `estimated_minutes`

---

## 8. Autenticação

- Tela `/login`: formulário email + senha, sem opção de cadastro público
- Usar `supabase.auth.signInWithPassword()`
- Criar os 3 usuários manualmente pelo painel do Supabase (Authentication > Users)
- Após login bem-sucedido: redirecionar para `/`
- Botão de logout no rodapé do Menu

---

## 9. Variáveis de Ambiente

Criar arquivo `.env.local` (nunca commitar):

```
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon_key>
```

Usar via `import.meta.env.VITE_SUPABASE_URL`.

---

## 10. Ordem de Desenvolvimento

Seguir esta sequência para manter entregas funcionais a cada etapa:

1. **Setup**: Vite + React + TypeScript + Tailwind + Supabase client + variáveis de ambiente
2. **Auth**: tela de login, proteção de rotas, logout
3. **Schema DB**: criar tabelas e políticas RLS no Supabase
4. **Layout base**: grid da Sala de Comando com as 4 áreas (menu, agenda, tarefas, notas) — apenas estrutura visual sem lógica
5. **Clientes**: CRUD básico (modal + listagem no menu hover)
6. **Tarefas**: listagem com cards, abas por cliente, filtros, modal de criação
7. **Drag & Drop**: arrastar cards para a Agenda, reposicionar dentro da Agenda
8. **Agenda**: grid de horas, renderização dos cards alocados
9. **Notas**: editor Tiptap, abas, salvamento automático
10. **Refinamento visual**: aplicar frontend-design skill, polimento de animações e micro-interações

---

## 11. Regras Gerais do Agente

- **Sempre** ler a skill `frontend-design` antes de criar qualquer componente visual
- Nunca usar `Inter`, `Roboto` ou `Arial` como fonte
- Nunca usar gradientes roxos ou paletas genéricas de UI kit
- Todo componente novo deve ser tipado (TypeScript estrito)
- Usar `supabase-js` v2 para todas as operações de banco
- Commits semânticos: `feat:`, `fix:`, `style:`, `refactor:`
- Não implementar funcionalidades fora do escopo desta etapa sem confirmação do usuário

---

*Documento gerado para o projeto Noord CRM — Etapa 1 | noordshop*