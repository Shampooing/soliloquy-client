soliloquy-client
================

_Soliloquy_ is a free application to create and review notes, tasks, and calendar events, in a single consolidated space. It aims at bringing together two sets of  features that so far have mainly been addressed by distinct pieces of software:

* On one hand, a consolidated space to manage notes, projects, and calendars, among other things. This has roughly been the offering of applications such as [Notion](https://www.notion.so/) or [Coda](https://coda.io/);
* On the other, _Bidirectional linking_, in the sense that entries are able to reference each other, and are aware of which entries reference them. This is a core feature of applications such as [Roam Research](https://roamresearch.com/) or [Obsidian](https://obsidian.md/).

At its core, _Soliloquy_ is essentially a ledger, consisting of generic _entries_ and the relationships (_references_) linking them. More precisely, specialized versions of _entries_ are used to represent notes, tasks, and events, as well as their corresponding containers (notebooks, projects, and sagas respectively), and _references_ can link any two _entries_ together.

_Soliloquy_ is a web application that currently can only be used in a web browser (an Electron-based desktop application will hopefully come in the near future), and relies on a [backend](https://github.com/Shampooing/soliloquy-server) to read and write into the ledger.

Installation
------------

```
npm install
```

Usage
-----

Once the soliloquy [backend](https://github.com/Shampooing/soliloquy-server) is up and running on the same machine (on port 8000 by default, though it can be changed by tweaking `server_address` in `src/config.js`), run

```
npm run serve
```

to start the client on your localhost (on port 8080 or the next available port).

Then, visit http://localhost:8080 (replacing the port if applicable) to start using the application.