# Küchen-Chaos

A real-time cooperative kitchen game for 2–4 players, one iPad each, played in the browser. It follows scenario 1 ("Your first restaurant") of the Kitchen Rush revised rules, with its own dishes and artwork.

## Publish

1. Create a new GitHub repository, for example `kuechen-chaos`.
2. Upload `index.html` (and this README) to the main branch.
3. In the repository, open Settings → Pages, choose "Deploy from a branch", branch `main`, folder `/ (root)`, and save.
4. After a minute the game runs at `https://<your-username>.github.io/kuechen-chaos/`.

Everything is in the single `index.html`. No account or server setup is needed.

## Start a game

1. On every iPad, open the game address in Safari, type a name and pick a colour.
2. On one iPad (the host), tap "Open the restaurant". It shows a code such as `MANGO42`.
3. On the other iPads, type that code and tap "Join".
4. The host picks the settings and taps "Set the tables", then "Start the shift" once you have made a plan.

The iPads need internet access. They do not need to be on the same Wi-Fi. If the host iPad reloads, tap "Continue …" on its start screen.

Tips for the iPads:
- In Safari, tap Share → "Add to Home Screen" and start the game from that icon. It then runs full screen, which leaves more room for the board.
- Set Settings → Display & Brightness → Auto-Lock to "Never" on the host iPad while you play. If the host iPad locks, the other iPads pause until it wakes.
- A guest iPad that reloads goes straight back into its game.

## Settings

- Sand timer: how long each action blocks a space (the board game's timers run 25–30 s).
- Shift length: 4:30 is the normal time for this scenario, 5:00 the family time.
- Wrong moves: "Allowed" plays like the board game, where meals are checked when time is up. "Blocked" stops wrong plates, wrong ingredients and overcooking.

## Game log

After each round the host iPad stores the result. "Download game log" in the menu saves all rounds as a JSON file, including each chef's meals, mistakes and number of actions.

## How it syncs

The host iPad holds the game and shares it through a free public MQTT relay (HiveMQ, with EMQX and Mosquitto as fallbacks). Only game moves and first names are sent. For testing with your own relay, add `?broker=wss://your-relay/mqtt` to the address.
