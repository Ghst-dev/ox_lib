# What this fork changes

Forked from [overextended/ox_lib](https://github.com/overextended/ox_lib) for the Ghst-dev
server. **Almost all of it is the NUI.** The Lua library — every import, every module, every
export — is upstream's, so upstream's documentation at
[overextended.dev/ox_lib](https://overextended.dev/ox_lib) still applies.

Fork work lives on the **`ghst_ui`** branch, not `main`. `main` tracks upstream.

## Licence

**LGPL-3.0**, as upstream. See [LICENSE](../LICENSE) and [NOTICE.md](../NOTICE.md), both
unmodified — the NOTICE file is Linden and Luke's and states the terms this fork is
redistributed under.

Two of those terms matter here and are met by this document: *document any modifications made
to the original work*, and *preserve all copyright, license, and attribution notices*.

## The shape of it

| | |
|---|---|
| **92 files** under `web/src` | The NUI, rebuilt |
| **3 files** outside it | `.sync`, one default, one added event |

That ratio is the summary. This is a re-skin and a re-implementation of the interface, not a
change to what the library does.

## The UI is Svelte, not React

Upstream's NUI is React. This one is **Svelte 5 + Vite + Tailwind 4**, on the shared Ghst
tokens, so every interface on this server is built from one palette and one set of surfaces.

Everything was rebuilt rather than restyled: notifications, textUI, progress bars and circles,
the alert dialog, the context menu, the input dialog, list and radial menus, and the skill
check.

Two things fell out of the rebuild that were bugs rather than styling:

- **Native `<input type="color">`, `date` and `number` controls are gone**, replaced with
  themed ones. The native controls render in CEF with the operating system's chrome, which on
  a dark overlay is a white box.
- **A browser dev harness**, so every dialog can be driven without launching the game. It is
  reached through a dynamic import behind `import.meta.env.DEV` so it never ships, and
  `web/tools/check-tokens.mjs` runs after every build.

## Icons: Lucide, not FontAwesome

FontAwesome registered all three packs to resolve an arbitrary name at runtime — 27MB in
`node_modules`, and the reason the built bundle was 1.81MB.

`web/src/lib/icons.ts` is an explicit allowlist instead: every icon is a static import, the
bundler drops the ~1700 unused ones, and a name nothing sends costs nothing.

The trade is that **a name which is not on the list renders nothing** — silently, in a
production build, because `resolveIcon` returns null. Two rounds of callers have already
slipped through that gap. When adding a caller, check the name is registered, and sweep for
quoted strings on any line assigning `icon` rather than for `icon = '...'`: several callers
write `icon = cond and 'a' or 'b'`, which the obvious grep does not match.

FontAwesome-style names are still accepted and normalised (`fa-solid fa-car` → `car`), because
that is what the callers on this server already send.

## Notifications default to top-centre

`resource/settings.lua`, one line. Upstream's default is `top-right`.

The right edge is where `ghst_hud` draws the money and carry-weight readout, and a notification
stack landing on top of it hid the one element that moves when a notification is worth reading.

The value is `'top'`, not `'top-center'` — the Lua alias has no such member, and the page maps
`top` to the top-centre class itself.

**This is the default only.** A player who has saved a position through `/ox_lib` has a KVP
that wins over it, which is the point of the setting existing.

## `ox_lib:commandProperties`

The one added surface, in `imports/addCommand/server.lua`. Expect a conflict here when
rebasing on upstream.

It broadcasts the parameter list of every registered command **as declared**, alongside the
chat suggestion built from it:

```lua
AddEventHandler('ox_lib:commandProperties', function(commands) end)
-- { name: string, help: string?, params: OxCommandParams[]? }[]
```

`buildSuggestion` is lossy on purpose — it feeds a chat autocomplete, so it rewrites every
parameter as `{ name, help }`, folds the type into the help text as a `(type: number)` suffix,
and drops `optional` entirely. That is right for a chat box and useless for anything building
a form. `ghst_admin`'s palette turns these declarations into input fields: it needs the real
type to know which field to draw, and the real `optional` to know which it may leave empty.
Parsing the type back out of the suffix works; `optional` is simply gone.

Deliberately a **separate event** rather than extra keys on `chat:addSuggestions`, because
that payload is a contract other chat resources read and this one has exactly one consumer.

A client can also ask for the list rather than waiting to be pushed it, so a resource that
starts after `ox_lib` is not stuck with nothing.

The deprecated `lib.__addCommand` path is not covered: its parameters arrive as `'name:?type'`
strings rather than a table, and nothing here uses it.

## Ambient surfaces

Notifications, progress and textUI are drawn over live gameplay, and were built from the
**focused** panel material — 0.92 opacity, a solid `#2a2a2a` border and a 40px shadow — which
is for a panel that has taken focus with the game held still behind it.

They take the ambient tier now: a white 9% border, which lifts against a night sky where a
dark grey one reads as a hole punched in the screen, and a 10px shadow, which does not smear
across daylight concrete. Dialogs, menus, the radial and the skill check keep the focused
material, because they do take focus.

The rule is in `web/src/theme/tokens.css`: **if the game is moving behind it, ambient; if the
game is dimmed behind it, focused.**

## Building

```bash
pnpm --dir Scripts/ox_lib/web install
pnpm --dir Scripts/ox_lib/web run dev
pnpm --dir Scripts/ox_lib/web run build
```

Upstream builds with bun; this supports pnpm alongside it, because every other resource on
this server is pnpm and one toolchain is enough.

`build` runs `check-tokens.mjs` afterwards, which fails on a `var(--x)` with no fallback that
nothing in `src` declares.

## Deployment

`.sync` marks this fork deployable into `[ox]`, replacing the upstream release copy that
`ghst_sv` used to track. `ghst_sv` gitignores that path now — the source of truth is this
repository. A fork change reaches the server through an ordinary `./Tools/sync.sh ox_lib`.
