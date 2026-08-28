# Demo sandbox

Open `https://offline-ledger-import.sociobot.in/demo` (or run locally and open
`/demo`). It immediately loads a six-row March 2026 current-account statement:
one exact repeat and one running-balance jump leave a $30.00 closing difference.

The persistent **Demo — sample data, nothing is saved** banner exposes **Reset
demo** and **Start for real**. Demo drafts use the separate IndexedDB database
`demo:ledger-import-check`; real work uses `ledger-import-check`. The app never
reads or writes the real database while the demo banner is present. Start for
real erases the demo draft before navigating to `/`.
