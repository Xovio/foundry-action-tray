# Action Tray

A slide-out action tray for **Foundry VTT** and the **dnd5e** system. Select a token and everything it can do is one click away – no character sheet needed. Built for GMs who jump between many tokens in combat.

## Features

- **Actions grouped by action economy:** Actions, Bonus Actions, Reactions, Legendary, Mythic and Lair Actions
- **Quick stats on every entry:** attack bonus, save DC, damage, remaining uses and recharge
- **Combat header:** portrait, HP bar with temp HP, AC, speed, conditions and concentration
- **Action economy tracking:** action, bonus action and reaction are marked as spent when used and reset at the start of the creature's turn
- **Follow the turn:** the active combatant's token is selected automatically (GM, optional camera pan)
- **Legendary counters:** clickable legendary actions and resistances
- **Spells by level** with clickable spell slot pips
- **Spell points:** animated mana orb or bar with a custom liquid colour and spell costs per level (requires the [dnd5e-spellpoints](https://foundryvtt.com/packages/dnd5e-spellpoints) module)
- **Abilities, saves and skills** with passive scores, rollable from the tray
- **English and German** – choose under *Language* in the module settings

## Screenshots

The Action Tray is a toggleable panel to the left of the toolbar.

<img width="423" height="1023" alt="image" src="https://github.com/user-attachments/assets/61a33cc6-7d19-418d-bc28-2ff72cb8fde9" />

For spellcasters, it supports versions for Spell Slots and the optional Spell Point rule.

Spell Slots:

<img width="298" height="1371" alt="image" src="https://github.com/user-attachments/assets/af83d335-a049-4766-bfab-f585b1a0b2f5" />

Spell Points:

<img width="301" height="1369" alt="image" src="https://github.com/user-attachments/assets/92db30ba-ae06-4a7f-838d-68e5e6a1c65b" />


## Controls

| Input | Action |
|---|---|
| Click icon | Use the item |
| Right-click icon or name | Use without the dialog |
| Click name | Show description and individual activities |
| Middle-click name | Open the item sheet |
| Click portrait | Pan to the token |
| Click name in the header | Open or close the character sheet |
| `E` | Show or hide the tray |
| `K` | Show or hide skills |

Items can be hidden from the tray through their context menu on the character sheet.

## Requirements

- Foundry VTT v12 (tested with build 343)
- dnd5e 4.x (tested with 4.4.4)

Disable the older *Action Pack* module while using Action Tray: both use the same screen area and default keys.

## Installation

In Foundry, go to **Add-on Modules → Install Module** and paste this manifest URL:

```
https://github.com/Xovio/foundry-action-tray/releases/latest/download/module.json
```

## Credits

Inspired by [Action Pack](https://github.com/teroparvinen/foundry-action-pack) by Tero Parvinen (MIT).

## License

[MIT](LICENSE) – use it, change it, build on it.
