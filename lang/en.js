export default {
  title: "Action Tray",
  settings: {
    display: {
      name: "Display",
      hint: "Automatic: the GM sees the tray whenever a token is selected, players open it via button/key.",
      auto: "Automatic",
      selected: "When a token is selected",
      toggle: "Toggle manually",
      always: "Always open"
    },
    width: { name: "Width", small: "Narrow", medium: "Medium", large: "Wide" },
    alphabetic: { name: "Sort alphabetically", hint: "Otherwise in character sheet order." },
    showEmpty: { name: "Show used-up abilities" },
    showPassive: { name: "Show passive features of NPCs" },
    followTurn: { name: "Follow the turn (GM)", hint: "When the turn changes, the active combatant's token gets selected." },
    followPan: { name: "Pan to the combatant on turn change (GM)" },
    autoEconomy: {
      name: "Track action economy automatically",
      hint: "Using an action/bonus action/reaction in combat marks it as spent; it resets at the start of that creature's turn."
    },
    manaStyle: { name: "Show spell points as", hint: "Only for creatures with spell points (dnd5e-spellpoints module).", orb: "Mana orb", bar: "Bar" },
    manaColor: { name: "Mana liquid colour" }
  },
  keybindings: { toggle: "Toggle Action Tray", skills: "Toggle skills" },
  context: { show: "Show in Action Tray", hide: "Hide from Action Tray" },
  empty: "Select a token",
  groups: {
    action: "Actions",
    bonus: "Bonus Actions",
    reaction: "Reactions",
    legendary: "Legendary Actions",
    mythic: "Mythic Actions",
    lair: "Lair Actions",
    other: "Other"
  },
  sections: { combat: "Combat", spells: "Spells", inventory: "Inventory", passive: "Features" },
  inventory: { weapon: "Weapons", consumable: "Consumables", equipment: "Equipment", other: "Other" },
  spells: { innate: "Innate", atwill: "At will", pact: "Pact Magic", level: "Level {level}" },
  economy: {
    action: "Action",
    bonus: "Bonus",
    reaction: "Reaction",
    usedHint: "{label} spent – click to toggle",
    availableHint: "{label} available – click to toggle"
  },
  tags: {
    bonus: { label: "Bonus", title: "Bonus action" },
    reaction: { label: "Reaction", title: "Reaction" },
    legendary: { label: "Legendary", title: "Legendary action" },
    mythic: { label: "Mythic", title: "Mythic action" },
    lair: { label: "Lair", title: "Lair action" },
    legendaryCost: "Costs {count} legendary actions",
    concentration: { label: "C", title: "Concentration" },
    ritual: { label: "R", title: "Ritual" },
    unprepared: { label: "unprep.", title: "Not prepared – ritual only" }
  },
  stats: { toHit: "Attack bonus", save: "Saving throw", dc: "DC" },
  uses: {
    charged: "Charged",
    rollRecharge: "Roll recharge ({value}+)",
    consumes: "Consumes: {name}",
    remaining: "Remaining uses"
  },
  item: {
    useHint: "Use (right-click: skip dialog)",
    nameHint: "Click: details · Right-click: use without dialog · Middle-click: sheet",
    activityHint: "Right-click: skip dialog"
  },
  header: {
    hp: "Hit points {value}/{max}",
    tempHp: "(+{temp} temporary)",
    concentratingOn: "Concentrating on: {names}",
    pan: "Jump to token",
    sheet: "Open/close sheet",
    ac: "Armor Class",
    movement: "Movement",
    cr: "CR",
    level: "Level"
  },
  combat: { initiative: "Initiative", yourTurn: "Your turn", endTurn: "End turn" },
  legendary: {
    actions: "Legendary actions",
    actionsShort: "Leg. actions",
    resistances: "Legendary resistances",
    resistancesShort: "Leg. resist."
  },
  abilities: { save: "ST", saveHint: "Saving throw: {ability}" },
  skills: { title: "Skills", passive: "Passive" },
  mana: {
    title: "{name}: {value} / {max} – click to open the item",
    short: "SP",
    cost: "Cost in spell points",
    notEnough: "Not enough spell points"
  },
  error: { render: "{name}: {message}" }
};
