[English](README.md) | [한국어](README.ko.md) | [中文](README.zh.md) | [日本語](README.ja.md) | Español | [Tiếng Việt](README.vi.md) | [Português](README.pt.md)

# ultrapower

[![npm version](https://img.shields.io/npm/v/@liangjie559567/ultrapower?color=cb3837)](https://www.npmjs.com/package/@liangjie559567/ultrapower)
[![npm downloads](https://img.shields.io/npm/dm/@liangjie559567/ultrapower?color=blue)](https://www.npmjs.com/package/@liangjie559567/ultrapower)
[![GitHub stars](https://img.shields.io/github/stars/liangjie559567/ultrapower?style=flat&color=yellow)](https://github.com/liangjie559567/ultrapower/stargazers)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Sponsor](https://img.shields.io/badge/Sponsor-❤️-red?style=flat&logo=github)](https://github.com/sponsors/liangjie559567)

**Orquestación multi-agente para Claude Code. Curva de aprendizaje cero.**

*No aprendas Claude Code. Solo usa OMC.*

[Comenzar](#inicio-rápido) • [Documentación](https://yeachan-heo.github.io/ultrapower-website) • [Guía de Migración](docs/MIGRATION.md)

---

## Inicio Rápido

**Paso 1: Instalar**
```bash
/plugin marketplace add <<https://github.com/liangjie559567/ultrapower>>
/plugin install omc@ultrapower
```

**Paso 2: Configurar**
```bash
/omc:omc-setup
```

**Paso 3: Construye algo**
```
autopilot: build a REST API for managing tasks
```

Eso es todo. Todo lo demás es automático.

> **Instalación:** `npm install -g @liangjie559567/ultrapower`

### Actualizar

```bash

# 1. Actualizar el clon del marketplace

/plugin marketplace update omc

# 2. Volver a ejecutar el setup para actualizar la configuracion

/omc:omc-setup
```

> **Nota:** Si la actualizacion automatica del marketplace no esta activada, debes ejecutar manualmente `/plugin marketplace update omc` para sincronizar la ultima version antes de ejecutar el setup.

Si experimentas problemas despues de actualizar, limpia la cache antigua del plugin:

```bash
/omc:omc-doctor
```

<h1 align="center">Tu Claude acaba de recibir esteroides.</h1>

<p align="center">
  <img src="assets/omc-character.jpg" alt="ultrapower" width="400" />
</p>

---

## ¿Por qué ultrapower?

* **Cero configuración requerida** - Funciona inmediatamente con valores predeterminados inteligentes

* **Interfaz de lenguaje natural** - Sin comandos que memorizar, solo describe lo que quieres

* **Paralelización automática** - Tareas complejas distribuidas entre agentes especializados

* **Ejecución persistente** - No se rendirá hasta que el trabajo esté verificado y completo

* **Optimización de costos** - Enrutamiento inteligente de modelos ahorra 30-50% en tokens

* **Aprende de la experiencia** - Extrae y reutiliza automáticamente patrones de resolución de problemas

* **Visibilidad en tiempo real** - Barra de estado HUD muestra lo que está sucediendo internamente

---

## Características

### Modos de Ejecución

Múltiples estrategias para diferentes casos de uso - desde construcciones completamente autónomas hasta refactorización eficiente en tokens. [Aprende más →](https://yeachan-heo.github.io/ultrapower-website/docs.html#execution-modes)

| Modo | Velocidad | Usar Para |
| ------ | ------- | --------- |
| **Autopilot** | Rápido | Flujos de trabajo completamente autónomos |
| **Ultrawork** | Paralelo | Máximo paralelismo para cualquier tarea |
| **Ralph** | Persistente | Tareas que deben completarse totalmente |
| **Ultrapilot** | 3-5x más rápido | Sistemas multi-componente |
| **Swarm** | Coordinado | Tareas independientes en paralelo |
| **Pipeline** | Secuencial | Procesamiento multi-etapa |

### Orquestación Inteligente

* **44 agentes especializados** para arquitectura, investigación, diseño, pruebas, ciencia de datos

* **Enrutamiento inteligente de modelos** - Haiku para tareas simples, Opus para razonamiento complejo

* **Delegación automática** - El agente correcto para el trabajo, siempre

### Experiencia de Desarrollo

* **Palabras clave mágicas** - `ralph`, `ulw`, `plan` para control explícito

* **Barra de estado HUD** - Métricas de orquestación en tiempo real en tu barra de estado

* **Aprendizaje de habilidades** - Extrae patrones reutilizables de tus sesiones

* **Análisis y seguimiento de costos** - Comprende el uso de tokens en todas las sesiones

[Lista completa de características →](docs/REFERENCE.md)

---

## Palabras Clave Mágicas

Atajos opcionales para usuarios avanzados. El lenguaje natural funciona bien sin ellas.

| Palabra Clave | Efecto | Ejemplo |
| --------- | -------- | --------- |
| `autopilot` | Ejecución completamente autónoma | `autopilot: build a todo app` |
| `ralph` | Modo persistencia | `ralph: refactor auth` |
| `ulw` | Máximo paralelismo | `ulw fix all errors` |
| `plan` | Entrevista de planificación | `plan the API` |
| `ralplan` | Consenso de planificación iterativa | `ralplan this feature` |

**ralph incluye ultrawork:** Cuando activas el modo ralph, automáticamente incluye la ejecución paralela de ultrawork. No es necesario combinar palabras clave.

---

## Utilidades

### Espera de Límite de Tasa

Reanuda automáticamente sesiones de Claude Code cuando se reinician los límites de tasa.

```bash
omc wait          # Verificar estado, obtener orientación
omc wait --start  # Habilitar demonio de reanudación automática
omc wait --stop   # Deshabilitar demonio
```

**Requiere:** tmux (para detección de sesión)

### Etiquetas de notificación (Telegram/Discord)

Puedes configurar a quién etiquetar cuando los callbacks de stop envían el resumen de sesión.

```bash

# Definir/reemplazar lista de etiquetas

omc config-stop-callback telegram --enable --token <bot_token> --chat <chat_id> --tag-list "@alice,bob"
omc config-stop-callback discord --enable --webhook <url> --tag-list "@here,123456789012345678,role:987654321098765432"

# Actualizaciones incrementales

omc config-stop-callback telegram --add-tag charlie
omc config-stop-callback discord --remove-tag @here
omc config-stop-callback discord --clear-tags
```

Comportamiento de etiquetas:

* Telegram: `alice` se normaliza a `@alice`

* Discord: soporta `@here`, `@everyone`, IDs numéricos de usuario y `role:<id>`

* El callback `file` ignora las opciones de etiquetas

---

## Notificaciones

Puedes recibir notificaciones en tiempo real para eventos del ciclo de vida de la sesión.

Eventos compatibles:

* `session-start`

* `session-stop` (cuando un modo persistent entra en estado de espera/bloqueo)

* `session-end`

* `ask-user-question`

### Configuración

Agrega estas variables de entorno en tu perfil de shell (por ejemplo `~/.zshrc`, `~/.bashrc`):

```bash

# Discord Bot

export OMC_DISCORD_NOTIFIER_BOT_TOKEN="your_bot_token"
export OMC_DISCORD_NOTIFIER_CHANNEL="your_channel_id"

# Telegram

export OMC_TELEGRAM_BOT_TOKEN="your_bot_token"
export OMC_TELEGRAM_CHAT_ID="your_chat_id"

# Webhooks opcionales

export OMC_DISCORD_WEBHOOK_URL="your_webhook_url"
export OMC_SLACK_WEBHOOK_URL="your_webhook_url"
```

> Nota: las variables deben estar cargadas en el mismo shell donde ejecutas `claude`.

---

## Documentación

* **[Referencia Completa](docs/REFERENCE.md)** - Documentación completa de características

* **[Monitoreo de Rendimiento](docs/PERFORMANCE-MONITORING.md)** - Seguimiento de agentes, depuración y optimización

* **[Sitio Web](https://yeachan-heo.github.io/ultrapower-website)** - Guías interactivas y ejemplos

* **[Guía de Migración](docs/MIGRATION.md)** - Actualización desde v2.x

* **[Arquitectura](docs/ARCHITECTURE.md)** - Cómo funciona internamente

---

## Requisitos

* CLI de [Claude Code](https://docs.anthropic.com/claude-code)

* Suscripción Claude Max/Pro O clave API de Anthropic

### Opcional: Orquestación Multi-IA

OMC puede opcionalmente orquestar proveedores de IA externos para validación cruzada y consistencia de diseño. **No son necesarios** — OMC funciona completamente sin ellos.

| Proveedor | Instalación | Qué habilita |
| ----------- | ------------- | -------------- |
| [Gemini CLI](https://github.com/google-gemini/gemini-cli) | `npm install -g @google/gemini-cli` | Revisión de diseño, consistencia UI (contexto de 1M tokens) |
| [Codex CLI](https://github.com/openai/codex) | `npm install -g @openai/codex` | Validación de arquitectura, verificación cruzada de código |

**Costo:** 3 planes Pro (Claude + Gemini + ChatGPT) cubren todo por ~$60/mes.

---

## Licencia

MIT

---

<div align="center">

**Inspirado por:** [oh-my-opencode](https://github.com/code-yeongyu/oh-my-opencode) • [claude-hud](https://github.com/ryanjoachim/claude-hud) • [Superpowers](https://github.com/NexTechFusion/Superpowers) • [everything-claude-code](https://github.com/affaan-m/everything-claude-code)

**Curva de aprendizaje cero. Poder máximo.**

</div>

## Historial de Estrellas

[![Star History Chart](https://api.star-history.com/svg?repos=liangjie559567/ultrapower&type=date&legend=top-left)](https://www.star-history.com/#liangjie559567/ultrapower&type=date&legend=top-left)

## 💖 Apoya Este Proyecto

Si Oh-My-ClaudeCode ayuda a tu flujo de trabajo, considera patrocinar:

[![Sponsor on GitHub](https://img.shields.io/badge/Sponsor-❤️-red?style=for-the-badge&logo=github)](https://github.com/sponsors/liangjie559567)

### ¿Por qué patrocinar?

* Mantener el desarrollo activo

* Soporte prioritario para patrocinadores

* Influir en la hoja de ruta y características

* Ayudar a mantener el software gratuito y de código abierto

### Otras formas de ayudar

* ⭐ Dale una estrella al repositorio

* 🐛 Reporta errores

* 💡 Sugiere características

* 📝 Contribuye código
