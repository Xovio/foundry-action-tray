import { MODULE_ID, buildView, combatantFor, activationType } from "./data.js";
import { actorHtml, emptyHtml, footerHtml, summaryHtml } from "./render.js";
import { initI18n, t } from "./i18n.js";

const MAX_ACTORS = 6;

/** State that survives re-renders. */
const state = {
  manualOpen: false,
  hiddenUntilSelectionChange: false,
  expanded: new Set(),
  collapsed: new Set(["passive"]),
  skillsOpen: new Set(),
  lastKey: null,
  tokens: []
};

let root = null;
const setting = (key) => game.settings.get(MODULE_ID, key);

/* ------------------------------------------------------------------ Settings */

Hooks.once("init", () => {
  initI18n(MODULE_ID);
  const rerender = () => render();
  const reg = (key, data) => game.settings.register(MODULE_ID, key, { scope: "client", config: true, onChange: rerender, ...data });
  const S = (key) => `settings.${key}`;

  reg("display", {
    name: t(S("display.name")), hint: t(S("display.hint")),
    type: String, default: "auto",
    choices: { auto: t(S("display.auto")), selected: t(S("display.selected")), toggle: t(S("display.toggle")), always: t(S("display.always")) }
  });
  reg("width", {
    name: t(S("width.name")), type: String, default: "medium",
    choices: { small: t(S("width.small")), medium: t(S("width.medium")), large: t(S("width.large")) }
  });
  reg("alphabetic", { name: t(S("alphabetic.name")), hint: t(S("alphabetic.hint")), type: Boolean, default: false });
  reg("showEmpty", { name: t(S("showEmpty.name")), type: Boolean, default: false });
  reg("showPassive", { name: t(S("showPassive.name")), type: Boolean, default: true });
  reg("followTurn", { name: t(S("followTurn.name")), hint: t(S("followTurn.hint")), type: Boolean, default: true });
  reg("followPan", { name: t(S("followPan.name")), type: Boolean, default: false });
  reg("autoEconomy", { name: t(S("autoEconomy.name")), hint: t(S("autoEconomy.hint")), type: Boolean, default: true });
  reg("manaStyle", {
    name: t(S("manaStyle.name")), hint: t(S("manaStyle.hint")),
    type: String, default: "orb",
    choices: { orb: t(S("manaStyle.orb")), bar: t(S("manaStyle.bar")) }
  });
  const ColorField = foundry.data?.fields?.ColorField;
  reg("manaColor", {
    name: t(S("manaColor.name")),
    type: ColorField ? new ColorField({ nullable: false, initial: "#3d7be0" }) : String,
    default: "#3d7be0"
  });

  game.keybindings.register(MODULE_ID, "toggle", {
    name: t("keybindings.toggle"),
    editable: [{ key: "KeyE", modifiers: [] }],
    onDown: () => { toggleTray(); return true; }
  });
  game.keybindings.register(MODULE_ID, "skills", {
    name: t("keybindings.skills"),
    editable: [{ key: "KeyK", modifiers: [] }],
    onDown: () => {
      for (const token of state.tokens) {
        const uuid = token.actor?.uuid;
        if (!uuid) continue;
        if (state.skillsOpen.has(uuid)) state.skillsOpen.delete(uuid);
        else state.skillsOpen.add(uuid);
      }
      if (!isOpen()) { state.manualOpen = true; state.hiddenUntilSelectionChange = false; }
      render();
      return true;
    }
  });
});

/* ------------------------------------------------------------------ Setup */

Hooks.once("ready", () => {
  if (game.system.id !== "dnd5e") return;
  root = document.createElement("div");
  root.id = "action-tray";
  root.innerHTML = `<div class="at-panel"><div class="at-scroll"></div><footer class="at-footer"></footer></div>`;
  document.getElementById("interface")?.prepend(root);
  root.addEventListener("click", onClick);
  root.addEventListener("contextmenu", onContextMenu);
  root.addEventListener("auxclick", onAuxClick);
  root.addEventListener("mousedown", (ev) => { if (ev.button === 1) ev.preventDefault(); });
  render();
});

Hooks.on("getSceneControlButtons", (controls) => {
  const tokenControls = controls.find((c) => c.name === "token");
  tokenControls?.tools.push({
    name: MODULE_ID,
    title: t("title"),
    icon: "fas fa-hand-fist",
    button: true,
    onClick: () => toggleTray()
  });
});

function displayMode() {
  const mode = setting("display");
  if (mode === "auto") return game.user.isGM ? "selected" : "toggle";
  return mode;
}

function isOpen() {
  const mode = displayMode();
  if (mode === "always") return true;
  if (mode === "toggle") return state.manualOpen;
  return state.tokens.length > 0 && !state.hiddenUntilSelectionChange;
}

function toggleTray() {
  const mode = displayMode();
  if (mode === "toggle") state.manualOpen = !state.manualOpen;
  else if (mode === "selected") state.hiddenUntilSelectionChange = !state.hiddenUntilSelectionChange;
  render();
}

/** Selected tokens; players without a selection see their own character. */
function currentTokens() {
  const controlled = (canvas?.tokens?.controlled ?? []).filter((t) => ["character", "npc"].includes(t.actor?.type));
  if (controlled.length) return controlled.slice(0, MAX_ACTORS);
  const character = game.user.character;
  if (character && !game.user.isGM) {
    const token = character.getActiveTokens()[0];
    if (token) return [token];
    return [{ id: null, name: character.name, actor: character, document: { texture: { src: character.img }, parent: null, actorLink: true } }];
  }
  return [];
}

/* ------------------------------------------------------------------ Rendering */

const render = foundry.utils.debounce(doRender, 30);

async function doRender() {
  if (!root) return;
  state.tokens = currentTokens();
  const key = state.tokens.map((t) => t.id ?? t.actor?.id).join(",");
  if (key !== state.lastKey) state.hiddenUntilSelectionChange = false;

  root.className = `width-${setting("width")}${isOpen() ? " is-open" : ""}`;
  const scroller = root.querySelector(".at-scroll");
  const scrollTop = key === state.lastKey ? scroller.scrollTop : 0;
  state.lastKey = key;

  const settings = {
    alphabetic: setting("alphabetic"),
    showEmpty: setting("showEmpty"),
    showPassive: setting("showPassive"),
    manaStyle: setting("manaStyle"),
    manaColor: String(setting("manaColor") ?? "")
  };
  const views = [];
  for (const token of state.tokens) {
    try {
      views.push(buildView(token, settings));
    } catch (err) {
      console.error(`${MODULE_ID} | Failed to build view for ${token.name}`, err);
    }
  }

  const parts = [];
  for (const v of views) {
    try {
      parts.push(actorHtml(v, state));
    } catch (err) {
      console.error(`${MODULE_ID} | Failed to render ${v.name}`, err);
      parts.push(`<div class="at-error"><i class="fas fa-triangle-exclamation"></i> ${t("error.render", { name: v.name, message: err.message })}</div>`);
    }
  }
  scroller.innerHTML = parts.length ? parts.join("") : emptyHtml();
  root.querySelector(".at-footer").innerHTML = footerHtml(views.some((v) => v.combat?.isCurrent));

  // Restore expanded descriptions
  await Promise.all([...scroller.querySelectorAll(".at-item.is-expanded")].map(fillSummary));
  scroller.scrollTop = scrollTop;
  Hooks.callAll("action-tray.render", root, views);
}

async function fillSummary(li) {
  const item = await fromUuid(li.dataset.uuid);
  if (!item) return;
  try {
    li.querySelector(".at-summary").innerHTML = await summaryHtml(item);
  } catch (err) {
    console.error(`${MODULE_ID} | Description for ${item.name}`, err);
  }
}

/** Only re-render if a displayed actor is affected. */
function isShown(actor) {
  if (!actor) return false;
  return state.tokens.some((t) => t.actor === actor || (t.actor?.uuid && t.actor.uuid === actor.uuid));
}

Hooks.on("controlToken", () => render());
Hooks.on("canvasReady", () => render());
Hooks.on("updateActor", (actor) => { if (isShown(actor)) render(); });
Hooks.on("updateToken", (token) => { if (state.tokens.some((t) => t.id === token.id)) render(); });
for (const hook of ["createItem", "updateItem", "deleteItem"]) {
  Hooks.on(hook, (item) => { if (isShown(item.actor)) render(); });
}
for (const hook of ["createActiveEffect", "updateActiveEffect", "deleteActiveEffect"]) {
  Hooks.on(hook, (effect) => { if (isShown(effect.parent?.actor ?? effect.parent)) render(); });
}
for (const hook of ["createCombatant", "updateCombatant", "deleteCombatant", "deleteCombat", "createCombat"]) {
  Hooks.on(hook, () => render());
}

/* ------------------------------------------------------------------ Combat: follow the turn & action economy */

Hooks.on("updateCombat", async (combat, changed) => {
  render();
  if (!("turn" in changed) && !("round" in changed)) return;
  const combatant = combat.combatant;
  if (!combatant) return;

  // At the start of its own turn, action, bonus action and reaction are available again (only one GM writes).
  if (game.users.activeGM?.isSelf && combatant.getFlag(MODULE_ID, "used")) {
    await combatant.unsetFlag(MODULE_ID, "used");
  }

  if (game.user.isGM && setting("followTurn") && combat.scene?.id === canvas.scene?.id) {
    const token = combatant.token?.object;
    if (token) {
      token.control({ releaseOthers: true });
      if (setting("followPan")) canvas.animatePan({ x: token.center.x, y: token.center.y, duration: 300 });
    }
  }
});

Hooks.on("dnd5e.postUseActivity", (activity) => {
  if (!setting("autoEconomy")) return;
  const type = activationType(activity);
  if (!["action", "bonus", "reaction"].includes(type)) return;
  const actor = activity.actor;
  const token = actor?.token?.object ?? actor?.getActiveTokens()[0];
  const combatant = combatantFor(token);
  if (!combatant?.isOwner) return;
  combatant.setFlag(MODULE_ID, "used", { ...(combatant.getFlag(MODULE_ID, "used") ?? {}), [type]: true });
});

/* ------------------------------------------------------------------ Hide item (sheet context menu) */

Hooks.on("dnd5e.getItemContextOptions", (item, options) => {
  const hidden = item.getFlag(MODULE_ID, "hidden");
  options.push({
    name: hidden ? t("context.show") : t("context.hide"),
    icon: `<i class="fas ${hidden ? "fa-eye" : "fa-eye-slash"}"></i>`,
    callback: () => item.setFlag(MODULE_ID, "hidden", !hidden)
  });
});

/* ------------------------------------------------------------------ Interaction */

function contextOf(target) {
  const actorEl = target.closest(".at-actor");
  const token = actorEl ? state.tokens.find((t) => (t.id ?? null) === (actorEl.dataset.tokenId || null)) : null;
  return { actorEl, token, actor: token?.actor ?? null, itemEl: target.closest(".at-item") };
}

async function itemFrom(itemEl) {
  return itemEl ? fromUuid(itemEl.dataset.uuid) : null;
}

async function useItem(item, event, fast) {
  if (!item) return;
  if (fast) return item.use({ legacy: false, event: { shiftKey: true } }, { configure: false });
  return item.use({ legacy: false, event });
}

async function onClick(event) {
  const el = event.target.closest("[data-action]");
  if (!el || !root.contains(el)) return;
  event.preventDefault();
  const action = el.dataset.action;
  const { actorEl, token, actor, itemEl } = contextOf(el);

  switch (action) {
    case "use": return useItem(await itemFrom(itemEl), event, false);
    case "expand": {
      if (event.shiftKey) return useItem(await itemFrom(itemEl), event, true);
      const uuid = itemEl.dataset.uuid;
      if (state.expanded.has(uuid)) {
        state.expanded.delete(uuid);
        itemEl.classList.remove("is-expanded");
      } else {
        state.expanded.add(uuid);
        await fillSummary(itemEl);
        itemEl.classList.add("is-expanded");
      }
      return;
    }
    case "activity": {
      const item = await itemFrom(itemEl);
      return item?.system.activities?.get(el.dataset.activityId)?.use({ event }, {});
    }
    case "recharge": {
      const item = await itemFrom(itemEl);
      return item?.system.uses?.rollRecharge({ apply: true, event });
    }
    case "slot": {
      const key = el.closest(".at-dots").dataset.key;
      return setCounter(actor, `system.spells.${key}.value`, Number(el.dataset.index));
    }
    case "legact": return setCounter(actor, "system.resources.legact.value", Number(el.dataset.index));
    case "legres": return setCounter(actor, "system.resources.legres.value", Number(el.dataset.index));
    case "check": return actor?.rollAbilityCheck({ ability: el.dataset.ability, event });
    case "save": return actor?.rollSavingThrow({ ability: el.dataset.ability, event });
    case "skill": return actor?.rollSkill({ skill: el.dataset.skill, event });
    case "toggle-skills": {
      const uuid = actorEl.dataset.actorUuid;
      if (state.skillsOpen.has(uuid)) state.skillsOpen.delete(uuid);
      else state.skillsOpen.add(uuid);
      actorEl.querySelector(".at-skills")?.classList.toggle("is-open", state.skillsOpen.has(uuid));
      return;
    }
    case "toggle-section": {
      const section = el.closest(".at-section");
      const key = section.dataset.section;
      if (state.collapsed.has(key)) state.collapsed.delete(key);
      else state.collapsed.add(key);
      for (const s of root.querySelectorAll(`.at-section[data-section="${key}"]`)) s.classList.toggle("is-collapsed", state.collapsed.has(key));
      return;
    }
    case "sheet": {
      if (!actor) return;
      return actor.sheet.rendered ? actor.sheet.close() : actor.sheet.render(true);
    }
    case "pan": {
      if (token?.center) return canvas.animatePan({ x: token.center.x, y: token.center.y, duration: 250 });
      return;
    }
    case "initiative": {
      const combatant = combatantFor(token);
      if (combatant) return game.combat.rollInitiative([combatant.id]);
      return;
    }
    case "economy": {
      const combatant = combatantFor(token);
      if (!combatant?.isOwner) return;
      const used = { ...(combatant.getFlag(MODULE_ID, "used") ?? {}) };
      used[el.dataset.key] = !used[el.dataset.key];
      return combatant.setFlag(MODULE_ID, "used", used);
    }
    case "end-turn": return game.combat?.nextTurn();
    case "mana": {
      const { spellPointsFor } = await import("./data.js");
      const mana = actor ? spellPointsFor(actor) : null;
      return mana ? actor.items.get(mana.id)?.sheet.render(true) : null;
    }
  }
}

/** Clicking dot i sets the value to i+1, or – if it is already exactly there – lowers it by one. */
function setCounter(actor, path, index) {
  if (!actor) return;
  const current = foundry.utils.getProperty(actor, path) ?? 0;
  const next = current === index + 1 ? index : index + 1;
  return actor.update({ [path]: next });
}

async function onContextMenu(event) {
  const el = event.target.closest("[data-action]");
  if (!el || !root.contains(el)) return;
  const action = el.dataset.action;
  const { actor, itemEl } = contextOf(el);
  if (["use", "expand"].includes(action)) {
    event.preventDefault();
    return useItem(await itemFrom(itemEl), event, true);
  }
  if (action === "activity") {
    event.preventDefault();
    const item = await itemFrom(itemEl);
    return item?.system.activities?.get(el.dataset.activityId)?.use({ event }, { configure: false });
  }
  if (["check", "save", "skill"].includes(action) && actor) {
    event.preventDefault();
    const fast = { configure: false };
    if (action === "check") return actor.rollAbilityCheck({ ability: el.dataset.ability, event }, fast);
    if (action === "save") return actor.rollSavingThrow({ ability: el.dataset.ability, event }, fast);
    return actor.rollSkill({ skill: el.dataset.skill, event }, fast);
  }
}

async function onAuxClick(event) {
  if (event.button !== 1) return;
  const el = event.target.closest("[data-action]");
  if (!el || !root.contains(el)) return;
  const { itemEl } = contextOf(el);
  const item = await itemFrom(itemEl);
  if (item) {
    event.preventDefault();
    item.sheet.render(true);
  }
}
