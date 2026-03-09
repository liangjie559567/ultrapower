[English](README.md) | [한국어](README.ko.md) | [中文](README.zh.md) | [日本語](README.ja.md) | [Español](README.es.md) | [Tiếng Việt](README.vi.md) | Português

# ultrapower

[![npm version](https://img.shields.io/npm/v/@liangjie559567/ultrapower?color=cb3837)](https://www.npmjs.com/package/@liangjie559567/ultrapower)
[![npm downloads](https://img.shields.io/npm/dm/@liangjie559567/ultrapower?color=blue)](https://www.npmjs.com/package/@liangjie559567/ultrapower)
[![GitHub stars](https://img.shields.io/github/stars/liangjie559567/ultrapower?style=flat&color=yellow)](https://github.com/liangjie559567/ultrapower/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Sponsor](https://img.shields.io/badge/Sponsor-❤️-red?style=flat&logo=github)](https://github.com/sponsors/liangjie559567)

**Orquestração multiagente para Claude Code. Curva de aprendizado zero.**

*Não aprenda Claude Code. Só use OMC.*

[Começar Rápido](#início-rápido) • [Documentação](https://yeachan-heo.github.io/ultrapower-website) • [Guia de Migração](docs/MIGRATION.md)

---

## Início Rápido

**Passo 1: Instale**
```bash
/plugin marketplace add <<https://github.com/liangjie559567/ultrapower>>
/plugin install omc@ultrapower
```

**Passo 2: Configure**
```bash
/omc:omc-setup
```

**Passo 3: Crie algo**
```
autopilot: build a REST API for managing tasks
```

É isso. Todo o resto é automático.

## Modo Team (Recomendado)

A partir da **v4.1.7**, o **Team** é a superfície canônica de orquestração no OMC. Entrypoints legados como **swarm** e **ultrapilot** continuam com suporte, mas agora **roteiam para Team por baixo dos panos**.

```bash
/omc:team 3:executor "fix all TypeScript errors"
```

O Team roda como um pipeline em estágios:

`team-plan → team-prd → team-exec → team-verify → team-fix (loop)`

Ative os times nativos do Claude Code em `~/.claude/settings.json`:

```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

> Se os times estiverem desativados, o OMC vai avisar você e fazer fallback para execução sem Team quando possível.

> **Instalação:** `npm install -g @liangjie559567/ultrapower`

### Atualizando

```bash

# 1. Atualize o clone do marketplace

/plugin marketplace update omc

# 2. Execute o setup novamente para atualizar a configuração

/omc:omc-setup
```

> **Observação:** Se a atualização automática do marketplace não estiver habilitada, você precisa executar manualmente `/plugin marketplace update omc` para sincronizar a versão mais recente antes de executar o setup.

Se você tiver problemas depois de atualizar, limpe o cache antigo do plugin:

```bash
/omc:omc-doctor
```

<h1 align="center">Seu Claude acabou de tomar esteroides.</h1>

<p align="center">
  <img src="assets/omc-character.jpg" alt="ultrapower" width="400" />
</p>

---

## Por que ultrapower?

* **Configuração zero** - Funciona de cara com padrões inteligentes

* **Orquestração team-first** - Team é a superfície canônica multiagente (swarm/ultrapilot são fachadas de compatibilidade)

* **Interface em linguagem natural** - Sem comandos para decorar, é só descrever o que você quer

* **Paralelização automática** - Tarefas complexas distribuídas entre agentes especializados

* **Execução persistente** - Não desiste até o trabalho ser verificado como concluído

* **Otimização de custo** - Roteamento inteligente de modelos economiza de 30% a 50% em tokens

* **Aprende com a experiência** - Extrai e reutiliza automaticamente padrões de resolução de problemas

* **Visibilidade em tempo real** - A HUD statusline mostra o que está acontecendo por baixo dos panos

---

## Recursos

### Modos de Orquestração

Múltiplas estratégias para diferentes casos de uso — da orquestração com Team até refatoração com eficiência de tokens. [Saiba mais →](https://yeachan-heo.github.io/ultrapower-website/docs.html#execution-modes)

| Modo | O que é | Usar para |
| ------ | --------- | ----------- |
| **Team (recommended)** | Pipeline canônico em estágios (`team-plan → team-prd → team-exec → team-verify → team-fix`) | Agentes coordenados trabalhando em uma lista de tarefas compartilhada |
| **Autopilot** | Execução autônoma (um único agente líder) | Trabalho de feature ponta a ponta com cerimônia mínima |
| **Ultrawork** | Paralelismo máximo (sem Team) | Rajadas de correções/refatorações paralelas quando Team não é necessário |
| **Ralph** | Modo persistente com loops de verify/fix | Tarefas que precisam ser concluídas por completo (sem parciais silenciosos) |
| **Pipeline** | Processamento sequencial por estágios | Transformações em múltiplas etapas com ordenação rigorosa |
| **Swarm / Ultrapilot (legacy)** | Fachadas de compatibilidade que roteiam para **Team** | Workflows existentes e documentação antiga |

### Orquestração Inteligente

* **44 agentes especializados** para arquitetura, pesquisa, design, testes e ciência de dados

* **Roteamento inteligente de modelos** - Haiku para tarefas simples, Opus para raciocínio complexo

* **Delegação automática** - O agente certo para o trabalho, sempre

### Experiência do Desenvolvedor

* **Magic keywords** - `ralph`, `ulw`, `plan` para controle explícito

* **HUD statusline** - Métricas de orquestração em tempo real na sua barra de status

* **Aprendizado de skills** - Extraia padrões reutilizáveis das suas sessões

* **Analytics e rastreamento de custos** - Entenda o uso de tokens em todas as sessões

[Lista completa de recursos →](docs/REFERENCE.md)

---

## Magic Keywords

Atalhos opcionais para usuários avançados. Linguagem natural funciona bem sem eles.

| Palavra-chave | Efeito | Exemplo |
| --------------- | -------- | --------- |
| `team` | Orquestração canônica com Team | `/omc:team 3:executor "fix all TypeScript errors"` |
| `autopilot` | Execução autônoma completa | `autopilot: build a todo app` |
| `ralph` | Modo persistente | `ralph: refactor auth` |
| `ulw` | Paralelismo máximo | `ulw fix all errors` |
| `plan` | Entrevista de planejamento | `plan the API` |
| `ralplan` | Consenso de planejamento iterativo | `ralplan this feature` |
| `swarm` | Palavra-chave legada (roteia para Team) | `swarm 5 agents: fix lint errors` |
| `ultrapilot` | Palavra-chave legada (roteia para Team) | `ultrapilot: build a fullstack app` |

**Notas:**

* **ralph inclui ultrawork**: quando você ativa o modo ralph, ele inclui automaticamente a execução paralela do ultrawork.

* A sintaxe `swarm N agents` ainda é reconhecida para extração da contagem de agentes, mas o runtime é baseado em Team na v4.1.7+.

## Utilitários

### Espera de Rate Limit

Retoma automaticamente sessões do Claude Code quando os rate limits são resetados.

```bash
omc wait          # Check status, get guidance
omc wait --start  # Enable auto-resume daemon
omc wait --stop   # Disable daemon
```

**Requer:** tmux (para detecção de sessão)

### Tags de Notificação (Telegram/Discord)

Você pode configurar quem recebe tag quando callbacks de parada enviam resumos de sessão.

```bash

# Set/replace tag list

omc config-stop-callback telegram --enable --token <bot_token> --chat <chat_id> --tag-list "@alice,bob"
omc config-stop-callback discord --enable --webhook <url> --tag-list "@here,123456789012345678,role:987654321098765432"

# Incremental updates

omc config-stop-callback telegram --add-tag charlie
omc config-stop-callback discord --remove-tag @here
omc config-stop-callback discord --clear-tags
```

Comportamento das tags:

* Telegram: `alice` vira `@alice`

* Discord: suporta `@here`, `@everyone`, IDs numéricos de usuário e `role:<id>`

* callbacks de `file` ignoram opções de tag

---

## Documentação

* **[Referência Completa](docs/REFERENCE.md)** - Documentação completa de recursos

* **[Monitoramento de Performance](docs/PERFORMANCE-MONITORING.md)** - Rastreamento de agentes, debugging e otimização

* **[Website](https://yeachan-heo.github.io/ultrapower-website)** - Guias interativos e exemplos

* **[Guia de Migração](docs/MIGRATION.md)** - Upgrade a partir da v2.x

* **[Arquitetura](docs/ARCHITECTURE.md)** - Como funciona por baixo dos panos

---

## Requisitos

* [Claude Code](https://docs.anthropic.com/claude-code) CLI

* Assinatura Claude Max/Pro OU chave de API da Anthropic

### Opcional: Orquestração Multi-AI

O OMC pode opcionalmente orquestrar provedores externos de IA para validação cruzada e consistência de design. Eles **não são obrigatórios** — o OMC funciona completamente sem eles.

| Provedor | Instalação | O que habilita |
| ---------- | ------------ | ---------------- |
| [Gemini CLI](https://github.com/google-gemini/gemini-cli) | `npm install -g @google/gemini-cli` | Revisão de design, consistência de UI (contexto de 1M tokens) |
| [Codex CLI](https://github.com/openai/codex) | `npm install -g @openai/codex` | Validação de arquitetura, checagem cruzada de code review |

**Custo:** 3 planos Pro (Claude + Gemini + ChatGPT) cobrem tudo por cerca de US$60/mês.

---

## Licença

MIT

---

<div align="center">

**Inspirado por:** [oh-my-opencode](https://github.com/code-yeongyu/oh-my-opencode) • [claude-hud](https://github.com/ryanjoachim/claude-hud) • [Superpowers](https://github.com/NexTechFusion/Superpowers) • [everything-claude-code](https://github.com/affaan-m/everything-claude-code)

**Curva de aprendizado zero. Poder máximo.**

</div>

## Histórico de Stars

[![Star History Chart](https://api.star-history.com/svg?repos=liangjie559567/ultrapower&type=date&legend=top-left)](https://www.star-history.com/#liangjie559567/ultrapower&type=date&legend=top-left)

## 💖 Apoie Este Projeto

Se o Oh-My-ClaudeCode ajuda no seu fluxo de trabalho, considere patrocinar:

[![Sponsor on GitHub](https://img.shields.io/badge/Sponsor-❤️-red?style=for-the-badge&logo=github)](https://github.com/sponsors/liangjie559567)

### Por que patrocinar?

* Manter o desenvolvimento ativo

* Suporte prioritário para patrocinadores

* Influenciar o roadmap e os recursos

* Ajudar a manter o projeto livre e de código aberto

### Outras formas de ajudar

* ⭐ Dar star no repositório

* 🐛 Reportar bugs

* 💡 Sugerir recursos

* 📝 Contribuir com código
