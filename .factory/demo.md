# Demo sandbox

Open `https://offline-ledger-import.sociobot.in/demo` or `/demo?demo=1` locally. It opens a six-row March 2026 bank CSV already checked. The first screen shows its filename, one exact repeat, one balance gap, and a -$30.00 difference.

The sticky **Demo — sample data, nothing is saved** banner stays visible with **Reset demo** and **Start for real**. Reset restores the shipped sample. Start for real clears the demo namespace and opens the normal workspace.

Demo drafts and receipt entries use the IndexedDB database `demo:ledger-import-check`. Demo license state uses `demo:sb_license:offline-ledger-import` and its matching verdict key. Normal data uses the same names without `demo:`. The demo never reads or writes normal storage.
