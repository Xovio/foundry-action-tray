/**
 * Builds the tray view model for a token/actor (dnd5e 4.x, activity based).
 */
import { t } from "./i18n.js";

export const MODULE_ID = "action-tray";

/** Groups of the combat section – by action economy rather than by item type. */
export const COMBAT_GROUPS = ["action", "bonus", "reaction", "legendary", "mythic", "lair", "other"];

/** Action economy pips shown in combat. */
export const ECONOMY = ["action", "bonus", "reaction"];

const TAG_CLASSES = { bonus: "bonus", reaction: "reaction", legendary: "legendary", mythic: "legendary", lair: "lair" };
const typeTag = (type) => (TAG_CLASSES[type] ? { cls: TAG_CLASSES[type], label: t(`tags.${type}.label`), title: t(`tags.${type}.title`) } : null);

export function activitiesOf(item) {
  const riders = item.getFlag("dnd5e", "riders.activity") ?? [];
  return [...(item.system.activities ?? [])].filter((a) => !riders.includes(a.id));
}

export function activationType(activity) {
  const type = activity?.activation?.type;
  return type && type !== "none" ? type : null;
}

function primaryActivity(item) {
  return activitiesOf(item).find((a) => activationType(a)) ?? null;
}

function groupKey(type) {
  return COMBAT_GROUPS.includes(type) ? type : "other";
}

/** Available uses: recharge, own uses, consumption via activities, quantity. */
export function usesFor(item) {
  const s = item.system;
  const actor = item.actor;
  const uses = s.uses;

  const recharge = uses?.recovery?.find?.((r) => r.period === "recharge");
  if (recharge && uses?.max) return { recharge: recharge.formula || "6", charged: (uses.value ?? 0) > 0 };

  if (uses?.max > 0) {
    let available = uses.value ?? 0;
    let maximum = uses.max;
    if (item.type === "consumable" && s.quantity > 1) {
      available += (s.quantity - 1) * maximum;
      maximum *= s.quantity;
    }
    return { available, maximum };
  }

  for (const a of activitiesOf(item)) {
    for (const c of a.consumption?.targets ?? []) {
      const amount = Math.max(Number(c.value) || 1, 1);
      if (c.type === "itemUses") {
        const target = c.target ? actor?.items.get(c.target) : item;
        if (target?.system.uses?.max) {
          return {
            available: Math.floor((target.system.uses.value ?? 0) / amount),
            maximum: Math.floor(target.system.uses.max / amount),
            via: target === item ? null : target.name
          };
        }
      } else if (c.type === "material") {
        const target = actor?.items.get(c.target);
        if (target) return { available: Math.floor((target.system.quantity ?? 0) / amount), via: target.name };
      } else if (c.type === "attribute" && c.target && !c.target.startsWith("resources.leg")) {
        const value = foundry.utils.getProperty(actor?.system ?? {}, c.target);
        if (typeof value === "number") return { available: Math.floor(value / amount), via: c.target };
      } else if (c.type === "activityUses" && a.uses?.max) {
        return { available: a.uses.value ?? 0, maximum: a.uses.max };
      }
    }
    if (a.uses?.max > 0) return { available: a.uses.value ?? 0, maximum: a.uses.max };
  }

  if (item.type === "consumable") return { available: s.quantity ?? 0 };
  if (item.type === "weapon" && s.properties?.has?.("thr") && !s.properties.has("ret")) return { available: s.quantity ?? 0 };
  return null;
}

/** Quick stats for attacks/saves/damage so you do not need to open the description. */
function statsFor(item) {
  const stats = [];
  const toHit = item.labels?.toHit;
  if (toHit) stats.push({ cls: "hit", text: toHit, title: t("stats.toHit") });
  const save = activitiesOf(item).find((a) => a.type === "save" && a.save?.dc?.value);
  if (save) {
    const abl = save.save.ability?.first?.() ?? [...(save.save.ability ?? [])][0];
    const abbr = CONFIG.DND5E.abilities[abl]?.abbreviation ?? abl ?? "";
    stats.push({ cls: "save", text: `${t("stats.dc")} ${save.save.dc.value}${abbr ? ` ${abbr.toUpperCase()}` : ""}`, title: t("stats.save") });
  }
  const damages = item.labels?.damages ?? [];
  if (damages.length) {
    const first = damages[0];
    const text = (first.formula ?? first.label ?? "").replace(/\[[^\]]*\]/g, "").replace(/\s+/g, " ").trim();
    if (text) stats.push({ cls: "dmg", text: damages.length > 1 ? `${text} …` : text, title: damages.map((d) => d.label ?? d.formula).join(" / ") });
  }
  return stats;
}

function itemEntry(item, { showTypeTag, extraTags = [] }) {
  const s = item.system;
  const props = s.properties;
  const activity = primaryActivity(item);
  const type = activationType(activity);
  const tags = [...extraTags];

  const tag = showTypeTag ? typeTag(type) : null;
  if (tag) tags.push(tag);
  if ((type === "legendary" || type === "mythic") && activity.activation.value > 1) {
    tags.push({ cls: "legendary", label: `${activity.activation.value}×`, title: t("tags.legendaryCost", { count: activity.activation.value }) });
  }
  if (props?.has?.("concentration")) tags.push({ cls: "conc", label: t("tags.concentration.label"), title: t("tags.concentration.title") });
  if (props?.has?.("ritual")) tags.push({ cls: "ritual", label: t("tags.ritual.label"), title: t("tags.ritual.title") });

  const acts = activitiesOf(item);
  return {
    uuid: item.uuid,
    name: item.name,
    img: item.img,
    sort: item.sort ?? 0,
    tags,
    uses: usesFor(item),
    stats: statsFor(item),
    activities: acts.length > 1
      ? acts.map((a) => ({ id: a.id, name: a.name, img: a.img, type: activationType(a) }))
      : []
  };
}

function spellGroupTitle(key) {
  if (key === "innate") return CONFIG.DND5E.spellPreparationModes?.innate?.label ?? t("spells.innate");
  if (key === "atwill") return CONFIG.DND5E.spellPreparationModes?.atwill?.label ?? t("spells.atwill");
  if (key === "pact") return CONFIG.DND5E.spellPreparationModes?.pact?.label ?? t("spells.pact");
  const level = Number(key.replace("spell", ""));
  return CONFIG.DND5E.spellLevels?.[level] ?? t("spells.level", { level });
}

function movementText(movement) {
  if (!movement) return "";
  const units = movement.units ?? "";
  const parts = [];
  for (const [key, cfg] of Object.entries(CONFIG.DND5E.movementTypes ?? {})) {
    const value = movement[key];
    if (!value) continue;
    const label = typeof cfg === "string" ? cfg : cfg.label;
    parts.push(key === "walk" ? `${value}` : `${label} ${value}`);
  }
  return parts.length ? `${parts.join(" · ")} ${units}`.trim() : "";
}

/**
 * Spell points from the dnd5e-spellpoints module: a "Spell Points" feat with uses.value/max.
 * The actor flag dnd5espellpoints.item points to it; otherwise we search by origin or source label.
 */
export function spellPointsFor(actor) {
  if (!game.modules.get("dnd5e-spellpoints")?.active) return null;
  let config = {};
  try { config = game.settings.get("dnd5e-spellpoints", "settings") ?? {}; } catch { /* setting missing */ }
  const flagged = actor.flags?.dnd5espellpoints?.item;
  const item = (flagged && actor.items.get(flagged)) || actor.items.find((i) =>
    ["feat", "class"].includes(i.type) && (
      (i._stats?.compendiumSource ?? i.flags?.core?.sourceId ?? "").includes("dnd5e-spellpoints.module-items")
      || (config.spResource && i.system.source?.custom === config.spResource)
    ));
  const uses = item?.system.uses;
  if (!uses?.max) return null;
  return {
    id: item.id,
    uuid: item.uuid,
    name: item.name,
    value: uses.value ?? 0,
    max: uses.max,
    pct: Math.min(Math.max(((uses.value ?? 0) / uses.max) * 100, 0), 100),
    costs: config.spellPointsCosts ?? {},
    warlockUseSp: !!config.warlockUseSp
  };
}

export function combatantFor(token) {
  const combat = game.combat;
  if (!combat || !token) return null;
  return combat.combatants.find((c) => c.tokenId === token.id && c.sceneId === token.document.parent?.id)
    ?? (token.document.actorLink ? combat.combatants.find((c) => c.actorId === token.actor?.id) : null)
    ?? null;
}

const sortBy = (alpha) => (a, b) => (alpha ? a.name.localeCompare(b.name) : a.sort - b.sort);

/**
 * @param {Token} token
 * @param {object} settings  { alphabetic, showEmpty, showPassive }
 */
export function buildView(token, settings) {
  const actor = token.actor;
  const s = actor.system;
  const isNPC = actor.type === "npc";
  const canRitualUnprepared = actor.items.some((i) => i.type === "class" && i.system.identifier === "wizard");

  const combat = Object.fromEntries(COMBAT_GROUPS.map((k) => [k, { key: k, title: t(`groups.${k}`), items: [] }]));
  const spells = {};
  const inventory = {
    weapon: { title: t("inventory.weapon"), items: [] },
    consumable: { title: t("inventory.consumable"), items: [] },
    equipment: { title: t("inventory.equipment"), items: [] },
    other: { title: t("inventory.other"), items: [] }
  };
  const passive = [];
  const mana = spellPointsFor(actor);

  for (const item of actor.items) {
    if (item.getFlag(MODULE_ID, "hidden")) continue;
    if (mana && item.id === mana.id) continue;
    const activity = primaryActivity(item);
    const type = activationType(activity);

    if (!type) {
      if (isNPC && item.type === "feat" && settings.showPassive) passive.push(itemEntry(item, { showTypeTag: false }));
      continue;
    }

    const uses = usesFor(item);
    if (!settings.showEmpty && uses && !uses.recharge && uses.available <= 0) continue;

    if (item.type === "spell") {
      const mode = item.system.preparation?.mode ?? "prepared";
      const level = item.system.level ?? 0;
      const extraTags = [];
      if (mode === "prepared" && !item.system.preparation?.prepared && level > 0 && !isNPC) {
        if (item.system.properties?.has("ritual") && canRitualUnprepared) {
          extraTags.push({ cls: "unprepared", label: t("tags.unprepared.label"), title: t("tags.unprepared.title") });
        } else continue;
      }
      const key = ["innate", "atwill", "pact"].includes(mode) ? mode : `spell${level}`;
      spells[key] ??= { key, title: spellGroupTitle(key), items: [] };
      spells[key].items.push(itemEntry(item, { showTypeTag: true, extraTags }));
      continue;
    }

    const isCombat = item.type === "feat"
      || (item.type === "weapon" && (item.system.equipped || isNPC))
      || !["weapon", "consumable", "equipment", "tool", "loot", "container"].includes(item.type);
    if (isCombat) {
      combat[groupKey(type)].items.push(itemEntry(item, { showTypeTag: false }));
    } else if (item.type === "consumable") {
      if (item.system.type?.value === "ammo") continue;
      inventory.consumable.items.push(itemEntry(item, { showTypeTag: true }));
    } else if (item.type === "weapon") {
      inventory.weapon.items.push(itemEntry(item, { showTypeTag: true }));
    } else if (item.type === "equipment") {
      inventory.equipment.items.push(itemEntry(item, { showTypeTag: true }));
    } else {
      inventory.other.items.push(itemEntry(item, { showTypeTag: true }));
    }
  }

  // Attach spell slots – or, with spell points, the cost per level – to the groups
  for (const [key, group] of Object.entries(spells)) {
    const level = key.startsWith("spell") ? Number(key.slice(5)) : null;
    const usesPoints = mana && (key !== "pact" || mana.warlockUseSp);
    if (usesPoints && level) {
      const cost = Number(mana.costs[level]);
      if (cost) group.cost = { value: cost, affordable: mana.value >= cost };
      continue;
    }
    const slot = key === "pact" ? s.spells?.pact : level ? s.spells?.[key] : null;
    if (slot?.max) group.slots = { key, value: slot.value ?? 0, max: slot.max };
  }
  // Show empty spell levels that still have slots (e.g. for upcasting) – not with spell points
  for (let l = 1; l <= 9 && !mana; l++) {
    const slot = s.spells?.[`spell${l}`];
    const key = `spell${l}`;
    if (slot?.max && !spells[key] && Object.keys(spells).length) {
      spells[key] = { key, title: spellGroupTitle(key), items: [], slots: { key, value: slot.value ?? 0, max: slot.max } };
    }
  }

  const sorter = sortBy(settings.alphabetic);
  const finish = (groups) => Object.values(groups).filter((g) => g.items.length || g.slots).map((g) => ({ ...g, items: g.items.sort(sorter) }));
  const spellOrder = (k) => (k === "atwill" ? -3 : k === "innate" ? -2 : k === "pact" ? 10 : Number(k.replace("spell", "")));

  // Header
  const hp = s.attributes?.hp ?? {};
  const hpMax = Math.max((hp.max ?? 0) + (hp.tempmax ?? 0), 1);
  const combatant = combatantFor(token);
  const current = game.combat?.combatant;

  const effects = [];
  const seen = new Set();
  for (const e of actor.temporaryEffects ?? []) {
    const key = e.img + e.name;
    if (seen.has(key)) continue;
    seen.add(key);
    effects.push({ img: e.img, name: e.name });
  }

  return {
    tokenId: token.id,
    actorUuid: actor.uuid,
    name: token.name ?? actor.name,
    img: actor.img || token.document.texture.src,
    isNPC,
    subtitle: isNPC
      ? `${t("header.cr")} ${formatCR(s.details?.cr)}${s.details?.type?.value ? ` · ${CONFIG.DND5E.creatureTypes?.[s.details.type.value]?.label ?? s.details.type.value}` : ""}`
      : `${t("header.level")} ${s.details?.level ?? "?"}`,
    hp: {
      value: hp.value ?? 0,
      max: hp.max ?? 0,
      temp: hp.temp ?? 0,
      pct: Math.clamp?.(((hp.value ?? 0) / hpMax) * 100, 0, 100) ?? Math.min(Math.max(((hp.value ?? 0) / hpMax) * 100, 0), 100),
      tempPct: Math.min(((hp.temp ?? 0) / hpMax) * 100, 100)
    },
    ac: s.attributes?.ac?.value ?? "–",
    mana: mana ? { ...mana, style: settings.manaStyle ?? "orb", color: settings.manaColor || "#3d7be0" } : null,
    speed: movementText(s.attributes?.movement),
    effects,
    concentration: [...(actor.concentration?.items ?? [])].map((i) => i.name),
    legendary: isNPC ? {
      actions: s.resources?.legact?.max ? { value: s.resources.legact.value, max: s.resources.legact.max } : null,
      resistances: s.resources?.legres?.max ? { value: s.resources.legres.value, max: s.resources.legres.max } : null
    } : null,
    combat: combatant ? {
      id: combatant.id,
      initiative: combatant.initiative,
      needsInitiative: combatant.initiative === null || combatant.initiative === undefined,
      isCurrent: current?.id === combatant.id,
      used: combatant.getFlag(MODULE_ID, "used") ?? {}
    } : null,
    abilities: Object.entries(CONFIG.DND5E.abilities).map(([key, cfg]) => {
      const a = s.abilities?.[key] ?? {};
      return {
        key,
        abbr: (cfg.abbreviation ?? key).toUpperCase(),
        label: cfg.label,
        value: a.value,
        mod: a.mod ?? 0,
        save: typeof a.save === "object" ? a.save?.value ?? 0 : a.save ?? 0,
        saveProf: (a.proficient ?? 0) > 0
      };
    }),
    skills: Object.entries(s.skills ?? {}).map(([key, sk]) => ({
      key,
      label: CONFIG.DND5E.skills[key]?.label ?? key,
      ability: (CONFIG.DND5E.abilities[sk.ability]?.abbreviation ?? sk.ability ?? "").toUpperCase(),
      total: sk.total ?? 0,
      passive: sk.passive ?? 10 + (sk.total ?? 0),
      prof: sk.value ?? 0
    })).sort((a, b) => a.label.localeCompare(b.label)),
    sections: {
      combat: finish(combat),
      spells: finish(spells).sort((a, b) => spellOrder(a.key) - spellOrder(b.key)),
      inventory: finish(inventory),
      passive: passive.sort(sorter)
    }
  };
}

function formatCR(cr) {
  if (cr === undefined || cr === null) return "?";
  return { 0.125: "1/8", 0.25: "1/4", 0.5: "1/2" }[cr] ?? String(cr);
}
