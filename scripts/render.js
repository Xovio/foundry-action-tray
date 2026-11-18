import { ECONOMY } from "./data.js";
import { t } from "./i18n.js";

// foundry.utils.escapeHTML only exists from v13 on – own version for v12
const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ESC[c]);
const sign = (n) => (n >= 0 ? `+${n}` : `${n}`);

function dots(action, value, max, { key = "", cls = "" } = {}) {
  let out = `<span class="at-dots ${cls}" data-key="${esc(key)}">`;
  for (let i = 0; i < max; i++) {
    out += `<span class="at-dot ${i < value ? "is-full" : ""}" data-action="${action}" data-index="${i}"></span>`;
  }
  return `${out}</span>`;
}

function usesHtml(uses) {
  if (!uses) return "";
  if (uses.recharge) {
    return uses.charged
      ? `<span class="at-tag recharge is-charged" title="${t("uses.charged")}"><i class="fas fa-bolt"></i></span>`
      : `<span class="at-tag recharge" data-action="recharge" title="${esc(t("uses.rollRecharge", { value: uses.recharge }))}"><i class="fas fa-dice-six"></i> ${esc(uses.recharge)}+</span>`;
  }
  const empty = uses.available <= 0 ? " is-empty" : "";
  const text = uses.maximum ? `${uses.available}/${uses.maximum}` : `×${uses.available}`;
  const title = uses.via ? t("uses.consumes", { name: uses.via }) : t("uses.remaining");
  return `<span class="at-uses${empty}" title="${esc(title)}">${esc(text)}</span>`;
}

export function itemHtml(entry, expanded) {
  const tags = entry.tags.map((tag) => `<span class="at-tag ${tag.cls}" title="${esc(tag.title)}">${esc(tag.label)}</span>`).join("");
  const stats = entry.stats.map((s) => `<span class="at-stat ${s.cls}" title="${esc(s.title)}">${esc(s.text)}</span>`).join("");
  return `
    <li class="at-item${expanded ? " is-expanded" : ""}" data-uuid="${esc(entry.uuid)}">
      <div class="at-item-row">
        <div class="at-icon" data-action="use" title="${t("item.useHint")}" style="background-image:url('${esc(entry.img)}')">
          <i class="fas fa-dice-d20"></i>
        </div>
        <div class="at-item-main" data-action="expand" title="${t("item.nameHint")}">
          <div class="at-item-name"><span>${esc(entry.name)}</span>${usesHtml(entry.uses)}</div>
          ${stats ? `<div class="at-item-stats">${stats}</div>` : ""}
        </div>
        ${tags ? `<div class="at-tags">${tags}</div>` : ""}
      </div>
      <div class="at-summary"></div>
    </li>`;
}

function groupHtml(group, state, { withSlots = false } = {}) {
  let slots = withSlots && group.slots
    ? `${dots("slot", group.slots.value, group.slots.max, { key: group.slots.key, cls: "slots" })}<span class="at-count">${group.slots.value}/${group.slots.max}</span>`
    : "";
  if (withSlots && group.cost) {
    const short = group.cost.affordable ? "" : " is-short";
    slots = `<span class="at-cost${short}" title="${group.cost.affordable ? t("mana.cost") : t("mana.notEnough")}">${group.cost.value} ${t("mana.short")}</span>`;
  }
  const items = group.items.map((e) => itemHtml(e, state.expanded.has(e.uuid))).join("");
  return `
    <div class="at-group" data-group="${esc(group.key ?? group.title)}">
      <h3><span class="at-group-title">${esc(group.title)}</span>${slots}</h3>
      ${items ? `<ul class="at-items">${items}</ul>` : ""}
    </div>`;
}

function sectionHtml(key, icon, body, state) {
  if (!body) return "";
  const collapsed = state.collapsed.has(key);
  return `
    <section class="at-section${collapsed ? " is-collapsed" : ""}" data-section="${key}">
      <h2 data-action="toggle-section"><i class="fas ${icon}"></i><span>${esc(t(`sections.${key}`))}</span><i class="fas fa-chevron-down at-chevron"></i></h2>
      <div class="at-section-body">${body}</div>
    </section>`;
}

/** Mana orb or bar for spell points. */
function manaHtml(m, style) {
  const low = m.pct <= 25 ? " is-low" : "";
  const title = esc(t("mana.title", { name: m.name, value: m.value, max: m.max }));
  const vars = `--mana:${esc(m.color)};--level:${(100 - m.pct).toFixed(1)}%;--pct:${m.pct.toFixed(1)}%`;
  if (style === "bar") {
    return `
      <div class="at-mana-bar${low}" data-action="mana" title="${title}" style="${vars}">
        <div class="at-mana-bar-fill"></div>
        <span><i class="fas fa-droplet"></i> ${m.value} / ${m.max}</span>
      </div>`;
  }
  return `
    <div class="at-mana-orb${low}" data-action="mana" title="${title}" style="${vars}">
      <div class="at-orb-liquid"></div>
      <div class="at-orb-wave"></div>
      <div class="at-orb-wave at-orb-wave-2"></div>
      <div class="at-orb-gloss"></div>
      <span class="at-orb-value">${m.value}</span>
      <span class="at-orb-max">/${m.max}</span>
    </div>`;
}

function headerHtml(v) {
  const hpTitle = t("header.hp", { value: v.hp.value, max: v.hp.max }) + (v.hp.temp ? ` ${t("header.tempHp", { temp: v.hp.temp })}` : "");
  const hpState = v.hp.pct <= 25 ? "is-critical" : v.hp.pct <= 50 ? "is-bloodied" : "";
  const effects = v.effects.map((e) => `<img src="${esc(e.img)}" title="${esc(e.name)}" alt="">`).join("");
  const conc = v.concentration.length
    ? `<div class="at-conc" title="${esc(t("header.concentratingOn", { names: v.concentration.join(", ") }))}"><i class="fas fa-brain"></i>${esc(v.concentration.join(", "))}</div>`
    : "";

  let combat = "";
  if (v.combat) {
    const pips = ECONOMY.map((k) => {
      const used = v.combat.used?.[k];
      const label = t(`economy.${k}`);
      return `<span class="at-pip ${k}${used ? " is-used" : ""}" data-action="economy" data-key="${k}" title="${esc(t(used ? "economy.usedHint" : "economy.availableHint", { label }))}">${esc(label)}</span>`;
    }).join("");
    const init = v.combat.needsInitiative
      ? `<a class="at-init-roll" data-action="initiative"><i class="fas fa-dice-d20"></i> ${t("combat.initiative")}</a>`
      : `<span class="at-init" title="${t("combat.initiative")}"><i class="fas fa-bolt"></i>${esc(v.combat.initiative)}</span>`;
    combat = `
      <div class="at-combat${v.combat.isCurrent ? " is-current" : ""}">
        ${v.combat.isCurrent ? `<span class="at-turn">${t("combat.yourTurn")}</span>` : ""}
        <div class="at-economy">${pips}</div>
        ${init}
      </div>`;
  }

  let legendary = "";
  if (v.legendary?.actions || v.legendary?.resistances) {
    const la = v.legendary.actions
      ? `<div class="at-leg" title="${t("legendary.actions")}"><span>${t("legendary.actionsShort")}</span>${dots("legact", v.legendary.actions.value, v.legendary.actions.max, { cls: "diamond" })}</div>`
      : "";
    const lr = v.legendary.resistances
      ? `<div class="at-leg" title="${t("legendary.resistances")}"><span>${t("legendary.resistancesShort")}</span>${dots("legres", v.legendary.resistances.value, v.legendary.resistances.max, { cls: "shield" })}</div>`
      : "";
    legendary = `<div class="at-legendary">${la}${lr}</div>`;
  }

  return `
    <header class="at-head">
      <div class="at-portrait" data-action="pan" title="${t("header.pan")}" style="background-image:url('${esc(v.img)}')"></div>
      <div class="at-ident">
        <h1 data-action="sheet" title="${t("header.sheet")}">${esc(v.name)}</h1>
        <div class="at-sub">${esc(v.subtitle)}</div>
      </div>
      ${v.mana && v.mana.style !== "bar" ? manaHtml(v.mana, "orb") : ""}
      <div class="at-ac" title="${t("header.ac")}"><span>${esc(v.ac)}</span></div>
    </header>
    <div class="at-hp ${hpState}" title="${esc(hpTitle)}">
      <div class="at-hp-fill" style="width:${v.hp.pct}%"></div>
      ${v.hp.temp ? `<div class="at-hp-temp" style="width:${v.hp.tempPct}%"></div>` : ""}
      <span>${v.hp.value} / ${v.hp.max}${v.hp.temp ? ` <em>+${v.hp.temp}</em>` : ""}</span>
    </div>
    ${v.mana?.style === "bar" ? manaHtml(v.mana, "bar") : ""}
    <div class="at-meta">
      ${v.speed ? `<span title="${t("header.movement")}"><i class="fas fa-shoe-prints"></i>${esc(v.speed)}</span>` : ""}
      ${effects ? `<span class="at-effects">${effects}</span>` : ""}
    </div>
    ${conc}
    ${combat}
    ${legendary}`;
}

function abilitiesHtml(v) {
  return `<div class="at-abilities">${v.abilities.map((a) => `
    <div class="at-ability" title="${esc(a.label)} ${a.value ?? ""}">
      <a class="at-abl-check" data-action="check" data-ability="${a.key}"><b>${esc(a.abbr)}</b><span>${sign(a.mod)}</span></a>
      <a class="at-abl-save${a.saveProf ? " is-prof" : ""}" data-action="save" data-ability="${a.key}" title="${esc(t("abilities.saveHint", { ability: a.label }))}">${t("abilities.save")} ${sign(a.save)}</a>
    </div>`).join("")}</div>`;
}

const PROF_ICONS = { 0: "far fa-circle", 0.5: "fas fa-adjust", 1: "fas fa-check", 2: "fas fa-check-double" };

function skillsHtml(v, state) {
  const open = state.skillsOpen.has(v.actorUuid);
  const rows = v.skills.map((s) => `
    <a class="at-skill${s.prof >= 1 ? " is-prof" : ""}" data-action="skill" data-skill="${s.key}">
      <i class="${PROF_ICONS[s.prof] ?? PROF_ICONS[0]}"></i>
      <span class="at-skill-name">${esc(s.label)}</span>
      <span class="at-skill-abl">${esc(s.ability)}</span>
      <span class="at-skill-total">${sign(s.total)}</span>
      <span class="at-skill-passive" title="${t("skills.passive")}">${s.passive}</span>
    </a>`).join("");
  return `
    <div class="at-skills${open ? " is-open" : ""}">
      <a class="at-skills-toggle" data-action="toggle-skills"><i class="fas fa-list"></i> ${t("skills.title")} <i class="fas fa-chevron-down at-chevron"></i></a>
      <div class="at-skills-list">${rows}</div>
    </div>`;
}

export function actorHtml(v, state) {
  const { combat, spells, inventory, passive } = v.sections;
  const combatBody = combat.map((g) => groupHtml(g, state)).join("");
  const spellBody = spells.map((g) => groupHtml(g, state, { withSlots: true })).join("");
  const invBody = inventory.map((g) => groupHtml(g, state)).join("");
  const passiveBody = passive.length
    ? `<ul class="at-items">${passive.map((e) => itemHtml(e, state.expanded.has(e.uuid))).join("")}</ul>`
    : "";
  return `
    <article class="at-actor${v.combat?.isCurrent ? " is-current" : ""}" data-token-id="${esc(v.tokenId)}" data-actor-uuid="${esc(v.actorUuid)}">
      ${headerHtml(v)}
      ${abilitiesHtml(v)}
      ${skillsHtml(v, state)}
      ${sectionHtml("combat", "fa-swords", combatBody, state)}
      ${sectionHtml("spells", "fa-wand-sparkles", spellBody, state)}
      ${sectionHtml("inventory", "fa-sack", invBody, state)}
      ${sectionHtml("passive", "fa-feather", passiveBody, state)}
    </article>`;
}

export function emptyHtml() {
  return `<div class="at-empty"><i class="fas fa-dice-d20"></i><p>${t("empty")}</p></div>`;
}

/** Expanded description incl. properties and – if there are several – the individual activities. */
export async function summaryHtml(item) {
  const data = await item.getChatData({ secrets: item.isOwner });
  const props = (data.properties ?? []).map((p) => `<span class="at-prop">${esc(p)}</span>`).join("");
  const acts = [...(item.system.activities ?? [])];
  const buttons = acts.length > 1
    ? `<div class="at-activities">${acts.map((a) => `
        <a class="at-activity" data-action="activity" data-activity-id="${esc(a.id)}" title="${t("item.activityHint")}">
          <img src="${esc(a.img)}" alt=""><span>${esc(a.name)}</span>
        </a>`).join("")}</div>`
    : "";
  return `${buttons}<div class="at-desc">${data.description ?? ""}</div>${props ? `<div class="at-props">${props}</div>` : ""}`;
}

export function footerHtml(showEndTurn) {
  return showEndTurn ? `<a class="at-end-turn" data-action="end-turn"><i class="fas fa-forward-step"></i> ${t("combat.endTurn")}</a>` : "";
}
