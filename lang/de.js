export default {
  title: "Aktionsleiste",
  settings: {
    display: {
      name: "Anzeige",
      hint: "Automatisch: GM sieht die Leiste bei ausgewähltem Token, Spieler öffnen sie per Knopf/Taste.",
      auto: "Automatisch",
      selected: "Bei ausgewähltem Token",
      toggle: "Manuell umschalten",
      always: "Immer offen"
    },
    width: { name: "Breite", small: "Schmal", medium: "Mittel", large: "Breit" },
    alphabetic: { name: "Alphabetisch sortieren", hint: "Sonst wie im Charakterbogen." },
    showEmpty: { name: "Aufgebrauchte Fähigkeiten zeigen" },
    showPassive: { name: "Passive Eigenschaften bei NSCs zeigen" },
    followTurn: { name: "Dem Zug folgen (GM)", hint: "Bei Zugwechsel wird der Token des aktiven Kämpfers ausgewählt." },
    followPan: { name: "Beim Zugwechsel zur Figur schwenken (GM)" },
    autoEconomy: {
      name: "Aktionsökonomie automatisch markieren",
      hint: "Benutzte Aktion/Bonusaktion/Reaktion wird im Kampf automatisch als verbraucht markiert und zu Beginn des eigenen Zuges zurückgesetzt."
    },
    manaStyle: { name: "Spell Points anzeigen als", hint: "Nur für Figuren mit Spell Points (Modul dnd5e-spellpoints).", orb: "Manakugel", bar: "Balken" },
    manaColor: { name: "Farbe der Mana-Flüssigkeit" }
  },
  keybindings: { toggle: "Aktionsleiste ein-/ausblenden", skills: "Fertigkeiten ein-/ausblenden" },
  context: { show: "In Aktionsleiste zeigen", hide: "In Aktionsleiste ausblenden" },
  empty: "Token auswählen",
  groups: {
    action: "Aktionen",
    bonus: "Bonusaktionen",
    reaction: "Reaktionen",
    legendary: "Legendäre Aktionen",
    mythic: "Mythische Aktionen",
    lair: "Hortaktionen",
    other: "Weitere"
  },
  sections: { combat: "Kampf", spells: "Zauber", inventory: "Inventar", passive: "Eigenschaften" },
  inventory: { weapon: "Waffen", consumable: "Verbrauchsgüter", equipment: "Ausrüstung", other: "Sonstiges" },
  spells: { innate: "Angeboren", atwill: "Beliebig oft", pact: "Paktmagie", level: "Grad {level}" },
  economy: {
    action: "Aktion",
    bonus: "Bonus",
    reaction: "Reaktion",
    usedHint: "{label} verbraucht – Klick zum Umschalten",
    availableHint: "{label} verfügbar – Klick zum Umschalten"
  },
  tags: {
    bonus: { label: "Bonus", title: "Bonusaktion" },
    reaction: { label: "Reaktion", title: "Reaktion" },
    legendary: { label: "Legendär", title: "Legendäre Aktion" },
    mythic: { label: "Mythisch", title: "Mythische Aktion" },
    lair: { label: "Hort", title: "Hortaktion" },
    legendaryCost: "Kostet {count} Legendäre Aktionen",
    concentration: { label: "K", title: "Konzentration" },
    ritual: { label: "R", title: "Ritual" },
    unprepared: { label: "unvorb.", title: "Nicht vorbereitet – nur als Ritual" }
  },
  stats: { toHit: "Angriffsbonus", save: "Rettungswurf", dc: "SG" },
  uses: {
    charged: "Aufgeladen",
    rollRecharge: "Aufladung würfeln ({value}+)",
    consumes: "Verbraucht: {name}",
    remaining: "Verbleibende Nutzungen"
  },
  item: {
    useHint: "Benutzen (Rechtsklick: ohne Dialog)",
    nameHint: "Klick: Details · Rechtsklick: ohne Dialog benutzen · Mittelklick: Bogen",
    activityHint: "Rechtsklick: ohne Dialog"
  },
  header: {
    hp: "Trefferpunkte {value}/{max}",
    tempHp: "(+{temp} temporär)",
    concentratingOn: "Konzentriert sich auf: {names}",
    pan: "Zum Token springen",
    sheet: "Bogen öffnen/schließen",
    ac: "Rüstungsklasse",
    movement: "Bewegung",
    cr: "HG",
    level: "Stufe"
  },
  combat: { initiative: "Initiative", yourTurn: "Am Zug", endTurn: "Zug beenden" },
  legendary: {
    actions: "Legendäre Aktionen",
    actionsShort: "Leg. Aktionen",
    resistances: "Legendäre Resistenzen",
    resistancesShort: "Leg. Resistenz"
  },
  abilities: { save: "RW", saveHint: "Rettungswurf {ability}" },
  skills: { title: "Fertigkeiten", passive: "Passiv" },
  mana: {
    title: "{name}: {value} / {max} – Klick öffnet das Item",
    short: "SP",
    cost: "Kosten in Spell Points",
    notEnough: "Nicht genug Spell Points"
  },
  error: { render: "{name}: {message}" }
};
