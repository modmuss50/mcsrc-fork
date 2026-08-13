# [modsrc.dev](https://modsrc.dev/)

modsrc.dev is a browser-based viewer for decompiled Minecraft mod source. It searches public projects through the Modrinth API, downloads the selected primary JAR directly from Modrinth, and performs indexing and decompilation locally in the browser.

The first version reads top-level classes only. Mods packaged entirely as nested JARs are not supported yet.

## Local development

First build the Java indexer:

- `cd java`
- `./gradlew build`

Then build or run the web app:

- `nvm use`
- `npm install`
- `npm run dev`

## Credits

- Mod metadata and files: [Modrinth](https://modrinth.com/)
- Decompiler: [Vineflower](https://github.com/Vineflower/vineflower)
- Browser Vineflower runtime: [@run-slicer/vf](https://www.npmjs.com/package/@run-slicer/vf)

`./src/ui/intellij-icons/` includes icons from the IntelliJ Platform, licensed under Apache 2.0.
