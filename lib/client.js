window.__ModuleLoader__.load({
	id: "dsh-hitl-confirm",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		//#region src/client/index.js
		/**
		* dsh-hitl-confirm — client half.
		*
		* A modal (弹窗) rendered through the harness composer chain
		* (`conversation.composer`, the same takeover seat the built-in
		* ask_user_question UI uses). While the host's `hitl_confirm` tool is
		* paused inside `ctx.userQuestions.ask()`, the runtime delivers a
		* `kind: "question"` interaction to the chain; this entry's `select`
		* claims it ONLY when the question carries the HITL_HEADER brand (the
		* plugin's own dialogs), so ordinary questions keep flowing to the
		* built-in question UI (graceful degradation if this client is absent).
		*
		* Priority -100 puts this entry before the built-in (priority 0) in the
		* chain's ascending order, so branded questions are claimed here, not by
		* the generic UI. The modal shows the question, its context and every
		* candidate option (lettered A/B/C …), waits for the human to pick and
		* confirm, then answers the wait — the host resolves `ask()`, the tool
		* returns, and the execution chain resumes with the human's choice.
		*
		* UI text is localized through the harness `locale` service (zh + en).
		*/
		const inject = ["slots", "locale"];
		const ID = "dsh-hitl-confirm";
		/** Locale namespace for this plugin's dictionaries. */
		const NS = "hitl";
		/** Brand constant — MUST match src/index.js (HITL_HEADER). */
		const HITL_HEADER = "HITL/Confirm";
		const CSS = [
			".hitl-backdrop { position: fixed; inset: 0; z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 16px; background: rgba(8, 10, 16, .48); backdrop-filter: blur(2px); }",
			".hitl-dialog { box-sizing: border-box; width: min(560px, 100%); max-height: min(72vh, 600px); display: flex; flex-direction: column; overflow: hidden; border: 1px solid var(--dsw-alias-border-l2, rgba(127,127,137,.28)); border-radius: 16px; background: var(--dsw-specific-input-major, #ffffff); color: var(--dsw-alias-label-primary, #1f2329); box-shadow: var(--dsw-shadow-lv2, 0 16px 48px rgba(0,0,0,.32)); font-size: 14px; line-height: 20px; }",
			".hitl-dialog, .hitl-dialog * { box-sizing: border-box; }",
			".hitl-titlebar { flex: none; display: flex; align-items: center; gap: 8px; padding: 12px 16px; font-size: 13px; font-weight: 600; letter-spacing: .02em; color: var(--dsw-alias-label-primary, #1f2329); border-bottom: 1px solid var(--dsw-alias-border-l2, rgba(127,127,137,.16)); background: color-mix(in srgb, var(--dsw-alias-state-business-primary, #4f7cff) 10%, transparent); }",
			".hitl-pulse { width: 8px; height: 8px; border-radius: 50%; background: var(--dsw-alias-state-business-primary, #4f7cff); animation: hitl-pulse 1.1s ease-in-out infinite alternate; }",
			"@keyframes hitl-pulse { from { opacity: .35; } to { opacity: 1; } }",
			".hitl-body { flex: auto; min-height: 0; overflow-y: auto; padding: 14px 16px 4px; overscroll-behavior: contain; }",
			".hitl-question { font-size: 15px; line-height: 22px; font-weight: 600; color: var(--dsw-alias-label-primary, #1f2329); white-space: pre-wrap; word-break: break-word; }",
			".hitl-context { margin-top: 10px; padding: 10px 12px; border-radius: 10px; background: var(--dsw-alias-interactive-bg-hover, rgba(127,127,137,.08)); border: 1px solid var(--dsw-alias-border-l2, rgba(127,127,137,.16)); color: var(--dsw-alias-label-secondary, #565c66); font-size: 13px; line-height: 19px; white-space: pre-wrap; word-break: break-word; }",
			".hitl-context-title { display: block; margin-bottom: 4px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; color: var(--dsw-alias-label-caption, #8a9099); }",
			".hitl-options { margin-top: 12px; display: flex; flex-direction: column; gap: 8px; }",
			".hitl-option { display: flex; gap: 10px; align-items: flex-start; text-align: left; width: 100%; padding: 10px 12px; border: 1px solid var(--dsw-alias-border-l2, rgba(127,127,137,.24)); border-radius: 12px; background: var(--dsw-specific-input-major, #ffffff); color: inherit; font: inherit; cursor: pointer; transition: border-color .1s ease, background-color .1s ease, box-shadow .1s ease; }",
			".hitl-option:hover:not(:disabled) { border-color: var(--dsw-alias-state-business-primary, #4f7cff); }",
			".hitl-option[data-on=\"true\"] { border-color: var(--dsw-alias-state-business-primary, #4f7cff); background: color-mix(in srgb, var(--dsw-alias-state-business-primary, #4f7cff) 8%, transparent); box-shadow: 0 0 0 1px var(--dsw-alias-state-business-primary, #4f7cff) inset; }",
			".hitl-option:disabled { opacity: .55; cursor: default; }",
			".hitl-option-key { flex: none; display: grid; place-items: center; width: 22px; height: 22px; margin-top: 1px; border-radius: 7px; border: 1px solid var(--dsw-alias-border-l3, rgba(127,127,137,.35)); color: var(--dsw-alias-label-secondary, #565c66); font-size: 12px; font-weight: 700; }",
			".hitl-option[data-on=\"true\"] .hitl-option-key { background: var(--dsw-alias-state-business-primary, #4f7cff); border-color: var(--dsw-alias-state-business-primary, #4f7cff); color: #fff; }",
			".hitl-option-text { min-width: 0; }",
			".hitl-option-label { font-weight: 600; color: var(--dsw-alias-label-primary, #1f2329); white-space: pre-wrap; word-break: break-word; }",
			".hitl-option-desc { margin-top: 2px; color: var(--dsw-alias-label-secondary, #565c66); font-size: 12.5px; line-height: 18px; white-space: pre-wrap; word-break: break-word; }",
			".hitl-custom { margin-top: 12px; display: flex; flex-direction: column; gap: 6px; }",
			".hitl-custom-label { font-size: 12px; font-weight: 600; color: var(--dsw-alias-label-secondary, #565c66); }",
			".hitl-custom-input { width: 100%; resize: none; border: 1px solid var(--dsw-alias-border-l2, rgba(127,127,137,.28)); border-radius: 10px; background: var(--dsw-specific-input-major, #ffffff); color: var(--dsw-alias-label-primary, #1f2329); font: inherit; font-size: 13px; line-height: 18px; padding: 8px 10px; outline: none; }",
			".hitl-custom-input:focus { border-color: var(--dsw-alias-state-business-primary, #4f7cff); }",
			".hitl-error { margin-top: 10px; color: var(--dsw-alias-state-error-primary, #e5484d); font-size: 12.5px; line-height: 17px; }",
			".hitl-footer { flex: none; display: flex; justify-content: flex-end; align-items: center; gap: 10px; padding: 12px 16px 14px; border-top: 1px solid var(--dsw-alias-border-l2, rgba(127,127,137,.12)); }",
			".hitl-btn { height: 32px; padding: 0 16px; border-radius: 999px; border: 1px solid var(--dsw-alias-border-l3, rgba(127,127,137,.35)); background: transparent; color: var(--dsw-alias-label-secondary, #565c66); font-size: 13px; font-weight: 600; cursor: pointer; transition: opacity .1s ease, background-color .1s ease, border-color .1s ease; }",
			".hitl-btn:hover:not(:disabled) { background: var(--dsw-alias-interactive-bg-hover, rgba(127,127,137,.1)); color: var(--dsw-alias-label-primary, #1f2329); }",
			".hitl-btn:disabled { opacity: .5; cursor: default; }",
			".hitl-btn-primary { background: var(--dsw-alias-button-info-fill, #4f7cff); border-color: transparent; color: #fff; }",
			".hitl-btn-primary:hover:not(:disabled) { background: var(--dsw-alias-button-info-hover, #3a66f0); color: #fff; }",
			".hitl-hint { flex: 1; color: var(--dsw-alias-label-caption, #8a9099); font-size: 11.5px; }"
		].join("\n");
		/** One <style data-plugin> tag per load; the loader removes plugin-owned tags on unload. */
		function injectStyle() {
			const tagId = ID + "/modal.css";
			if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=\"" + tagId + "\"]") === null) {
				const tag = document.createElement("style");
				tag.dataset.plugin = ID;
				tag.dataset.pluginCss = tagId;
				tag.textContent = CSS;
				document.head.appendChild(tag);
			}
		}
		const ZH = {
			"title": "🧑‍💻 HITL 人工确认",
			"context.title": "决策上下文",
			"options.title": "候选选项",
			"custom.label": "其他（自定义回答）",
			"confirm": "确认选择",
			"cancel": "取消",
			"hint.multi": "可多选，然后确认。",
			"hint.single": "请选择一项后确认。",
			"error.need-choice": "请先选择一个选项（或填写自定义回答）。",
			"error.rejected": "确认结果未被接受",
			"cancelled.title": "已取消",
			"cancelled.text": "本次人工确认已取消，执行链路将按取消处理。"
		};
		const EN = {
			"title": "🧑‍💻 HITL Human Confirmation",
			"context.title": "Decision context",
			"options.title": "Candidate options",
			"custom.label": "Other (custom answer)",
			"confirm": "Confirm choice",
			"cancel": "Cancel",
			"hint.multi": "Multiple choices allowed, then confirm.",
			"hint.single": "Pick one option, then confirm.",
			"error.need-choice": "Pick an option first (or type a custom answer).",
			"error.rejected": "Confirmation response rejected",
			"cancelled.title": "Cancelled",
			"cancelled.text": "This HITL confirmation was cancelled; the run resumes as cancelled."
		};
		/** Whether a question interaction payload was asked by THIS plugin. */
		function isHitlQuestion(payload) {
			return Array.isArray(payload?.questions) && payload.questions.some((q) => q != null && typeof q.header === "string" && q.header === HITL_HEADER);
		}
		/** Composer chain router: claim only branded HITL questions, fall through otherwise. */
		function selectHitl({ interactions }) {
			if (!Array.isArray(interactions)) return null;
			return interactions.find((i) => i.kind === "question" && isHitlQuestion(i.payload)) ?? null;
		}
		/** The confirmation modal (composer takeover). */
		function HitlModal(props) {
			const wait = props.matched;
			const t = props.t;
			const question = wait.payload.questions[0];
			const options = Array.isArray(question.options) ? question.options : [];
			const multi = question.multiSelect === true;
			const [selected, setSelected] = (0, react.useState)([]);
			const [custom, setCustom] = (0, react.useState)("");
			const [busy, setBusy] = (0, react.useState)(false);
			const [error, setError] = (0, react.useState)(null);
			const toggle = (0, react.useCallback)(function(label) {
				setError(null);
				setSelected(function(current) {
					if (multi) return current.includes(label) ? current.filter(function(item) {
						return item !== label;
					}) : current.concat([label]);
					return current.includes(label) ? [] : [label];
				});
			}, [multi]);
			const confirm = (0, react.useCallback)(async function() {
				const customText = custom.trim();
				if (selected.length === 0 && customText === "") {
					setError(t("error.need-choice"));
					return;
				}
				setBusy(true);
				setError(null);
				try {
					const receipt = await wait.respond({
						ok: true,
						value: {
							sessionId: wait.sessionId,
							answer: { answers: [{
								id: question.id,
								selected: selected.slice(),
								...customText !== "" ? { custom: customText } : {}
							}] }
						}
					});
					if (!receipt.accepted) throw new Error(t("error.rejected") + ": " + receipt.reason);
				} catch (cause) {
					setBusy(false);
					setError(cause instanceof Error ? cause.message : String(cause));
				}
			}, [
				wait,
				question,
				selected,
				custom,
				t
			]);
			const cancel = (0, react.useCallback)(async function() {
				setBusy(true);
				setError(null);
				try {
					const receipt = await wait.respond({
						ok: false,
						error: {
							code: "cancelled",
							message: "the user closed this HITL confirmation",
							details: {}
						}
					});
					if (!receipt.accepted) throw new Error(t("error.rejected") + ": " + receipt.reason);
				} catch (cause) {
					setBusy(false);
					setError(cause instanceof Error ? cause.message : String(cause));
				}
			}, [wait, t]);
			const optionCards = options.map(function(option, index) {
				const label = option.label;
				const on = selected.includes(label);
				return (0, react.createElement)("button", {
					key: String(index) + ":" + label,
					type: "button",
					className: "hitl-option",
					"data-on": on ? "true" : "false",
					disabled: busy,
					onClick: function() {
						toggle(label);
					}
				}, (0, react.createElement)("span", {
					className: "hitl-option-key",
					"aria-hidden": "true"
				}, String.fromCharCode(65 + index)), (0, react.createElement)("span", { className: "hitl-option-text" }, (0, react.createElement)("span", { className: "hitl-option-label" }, label), option.description != null ? (0, react.createElement)("span", { className: "hitl-option-desc" }, String(option.description)) : null));
			});
			return (0, react.createElement)("div", { className: "hitl-backdrop" }, (0, react.createElement)("div", {
				className: "hitl-dialog",
				role: "dialog",
				"aria-modal": "true",
				"aria-label": t("title")
			}, (0, react.createElement)("div", { className: "hitl-titlebar" }, (0, react.createElement)("span", {
				className: "hitl-pulse",
				"aria-hidden": "true"
			}), (0, react.createElement)("span", null, t("title"))), (0, react.createElement)("div", { className: "hitl-body" }, (0, react.createElement)("div", { className: "hitl-question" }, question.question), question.detail != null ? (0, react.createElement)("div", { className: "hitl-context" }, (0, react.createElement)("span", { className: "hitl-context-title" }, t("context.title")), (0, react.createElement)("span", null, String(question.detail))) : null, options.length > 0 ? (0, react.createElement)("div", { className: "hitl-options" }, optionCards) : null, (0, react.createElement)("div", { className: "hitl-custom" }, (0, react.createElement)("label", {
				className: "hitl-custom-label",
				htmlFor: "hitl-custom"
			}, t("custom.label")), (0, react.createElement)("textarea", {
				id: "hitl-custom",
				className: "hitl-custom-input",
				rows: 2,
				placeholder: multi ? "" : void 0,
				value: custom,
				disabled: busy,
				onChange: function(event) {
					setCustom(event.target.value);
					setError(null);
				}
			})), error != null ? (0, react.createElement)("div", { className: "hitl-error" }, error) : null), (0, react.createElement)("div", { className: "hitl-footer" }, (0, react.createElement)("span", { className: "hitl-hint" }, multi ? t("hint.multi") : t("hint.single")), (0, react.createElement)("button", {
				type: "button",
				className: "hitl-btn",
				disabled: busy,
				onClick: cancel
			}, t("cancel")), (0, react.createElement)("button", {
				type: "button",
				className: "hitl-btn hitl-btn-primary",
				disabled: busy,
				onClick: confirm
			}, t("confirm")))));
		}
		function apply(ctx) {
			injectStyle();
			try {
				ctx.locale.register(NS, "zh", ZH);
				ctx.locale.register(NS, "en", EN);
			} catch (error) {
				console.error(ID + ": locale registration failed: " + String(error));
			}
			ctx.slots.inject("conversation.composer", function() {
				return ctx.slots.register({
					name: "conversation.composer",
					id: "hitl-confirm",
					priority: -100,
					select: selectHitl,
					locale: NS,
					label: "HITL confirm"
				}, HitlModal);
			});
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map