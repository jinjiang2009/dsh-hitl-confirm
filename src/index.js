/**
 * dsh-hitl-confirm — host half.
 *
 * Registers two human-in-the-loop entry points on the harness seam
 * `ctx.userQuestions` (the same capability that powers the built-in
 * ask_user_question tool):
 *
 *   1. `hitl_confirm` — a model-facing tool. When the agent cannot make a
 *      unique decision among candidate options (a / b / c …), it calls this
 *      tool; the current execution chain pauses inside
 *      `ctx.userQuestions.ask()` until a UI provider returns the human's
 *      choice, and the tool result feeds that choice back into the loop.
 *
 *   2. `/hitl-confirm` — a human command (ctx.commands) so a user can
 *      trigger the same dialog by hand, e.g. to pre-approve a direction
 *      before the model acts.
 *
 * The question is branded with a fixed `header` (HITL_HEADER) so the
 * client half of this plugin can claim it in the composer chain and render
 * its own modal instead of the generic question UI. All other questions
 * (from ask_user_question etc.) fall through to the built-in UI.
 *
 * There is no provider registration here: `dsh-host-apiproxy` owns the
 * single active user-questions provider that bridges host <-> browser. This
 * package is a Consumer of the seam, exactly like @deepseek-ai/dsh-tool-ask-user.
 */
import { defineTool } from '@deepseek-ai/dsh-tools'
import '@deepseek-ai/dsh-user-questions'
import '@deepseek-ai/dsh-commands'

/** cordis row id (must match cordis.patch.yml). */
const name = 'hitl-confirm'

/** Services this host bundle needs. */
const inject = ['tools', 'userQuestions', 'commands']

/**
 * Brand constant shared with the client half (src/client/index.js).
 * It rides the official `header` field of a user-question, the only
 * free-form wire field that survives the host's strict question schema
 * (`askUserQuestionItemSchema` strips unknown keys), so the client can
 * reliably recognize a question this plugin asked.
 */
const HITL_HEADER = 'HITL/Confirm'

/** Stable per-request question id (echoed back in the answer). */
function questionId() {
  const raw = (globalThis.crypto?.randomUUID?.() ?? String(Math.random()).slice(2))
  return 'hitl:' + raw
}

/** Build one user-questions request from tool/command arguments. */
function buildQuestions(args) {
  return [{
    id: questionId(),
    question: args.question,
    header: HITL_HEADER,
    ...(args.context !== undefined ? { detail: args.context } : {}),
    options: args.options.map((option) => ({
      label: option.label,
      ...(option.description !== undefined ? { description: option.description } : {})
    })),
    ...(args.multiSelect !== undefined ? { multiSelect: args.multiSelect } : {})
  }]
}

/** Map the seam's answer batch back to a compact tool result. */
function mapAnswer(result) {
  const answer = result.answers[0]
  return {
    selected: [...answer.selected],
    ...(answer.custom !== undefined ? { custom: answer.custom } : {})
  }
}

/** Render the tool result into the session log. */
function renderResult(_args, value) {
  return [{ type: 'text', text: JSON.stringify(value) }]
}

/**
 * Parse the raw /hitl-confirm input:
 *   the question is the first line that is not an option;
 *   an option is a line starting with "- " (or "* "), shaped
 *   "label: description", "label | description", or just "label".
 * No options -> a default Approve / Reject pair.
 */
function parseInvocation(raw) {
  const lines = String(raw ?? '').split(/\r?\n/).map((line) => line.trim())
  const options = []
  const questionLines = []
  for (const line of lines) {
    if (line === '') continue
    const optionMatch = /^[-*]\s+(.+)$/.exec(line)
    if (optionMatch) {
      const body = optionMatch[1]
      const sep = body.match(/^(.+?)\s*(?::\s*|\|\s*)(.+)$/)
      options.push(sep
        ? { label: sep[1].trim(), description: sep[2].trim() }
        : { label: body.trim() })
    } else {
      questionLines.push(line)
    }
  }
  const question = questionLines.join(' ').trim()
  if (question === '') throw new Error('no question given — first line should be the question text')
  return {
    question,
    options: options.length > 0 ? options : [
      { label: 'Approve', description: 'Agree and proceed with the proposed action.' },
      { label: 'Reject', description: 'Do not proceed; the agent should reconsider.' }
    ]
  }
}

function apply(ctx) {
  // ---- 1. Model-facing tool ------------------------------------------
  ctx.tools.register(defineTool({
    name: 'hitl_confirm',
    description: [
      'Pause the current execution chain and ask the human to make a decision you cannot confidently make alone.',
      'Call this ONLY when you face a genuine choice among mutually exclusive candidate options (for example A, B, or C) and are not sure which one to pick.',
      'The run stops, a visible modal opens in the UI showing every option together with its context, and the human picks one and confirms.',
      'Execution resumes with the selected option as the tool result.',
      'Do not call it for routine decisions you can make yourself.'
    ].join(' '),
    parameters: {
      question: {
        type: 'string',
        required: true,
        description: 'The decision question the human must answer, e.g. "Which deployment strategy should I use?"'
      },
      context: {
        type: 'string',
        description: 'Background context shown with the question so the human can judge the options (tradeoffs, constraints, implications).'
      },
      options: {
        type: 'array',
        required: true,
        description: 'The candidate options (a/b/c …). Put your recommended one first and append " (Recommended)" to its label.',
        items: {
          type: 'object',
          additionalProperties: true,
          properties: {
            label: {
              type: 'string',
              required: true,
              description: 'Short user-facing option label, e.g. "Option A: Blue-green deploy".'
            },
            description: {
              type: 'string',
              description: 'One sentence explaining this option\'s impact or tradeoff.'
            }
          }
        }
      },
      multi_select: {
        type: 'boolean',
        description: 'Whether the human may confirm more than one option. Defaults to false (exactly one choice).'
      }
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          selected: {
            type: 'array',
            required: true,
            items: { type: 'string' },
            description: 'Labels of the option(s) the human confirmed.'
          },
          custom: {
            type: 'string',
            description: 'Free-form answer when the human typed their own instead of picking an option.'
          }
        }
      },
      render: renderResult
    },
    async execute(args, exec) {
      const result = await ctx.userQuestions.ask({
        questions: buildQuestions({
          question: args.question,
          context: args.context,
          options: args.options,
          multiSelect: args.multi_select
        }),
        ...(exec.agent !== undefined ? { agent: exec.agent } : {}),
        signal: exec.signal
      })
      return mapAnswer(result)
    }
  }))

  // ---- 2. Human command ----------------------------------------------
  ctx.commands.register({
    name: 'hitl-confirm',
    description: 'Open a HITL confirmation dialog: the first line is the question, lines starting with "- " become options (a/b/c …)',
    input: {
      hint: '<question>\n- <option A>: <description>\n- <option B>: <description>'
    },
    handler: async (invocation) => {
      let parsed
      try {
        parsed = parseInvocation(invocation.rawInput)
      } catch (error) {
        return { kind: 'error', text: '/hitl-confirm: ' + (error instanceof Error ? error.message : String(error)) }
      }
      try {
        const result = await ctx.userQuestions.ask({
          questions: buildQuestions(parsed),
          ...(invocation.agent !== undefined ? { agent: invocation.agent } : {})
        })
        const answer = result.answers[0]
        const picked = answer.custom !== undefined && answer.custom !== ''
          ? answer.custom
          : answer.selected.join(', ')
        return { kind: 'success', text: 'Human confirmed: ' + picked }
      } catch (error) {
        return { kind: 'error', text: '/hitl-confirm: ' + (error instanceof Error ? error.message : String(error)) }
      }
    }
  })
}

export { apply, inject, name }
