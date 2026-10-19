import type { Persona } from "../gossipEnge/types.ts";
import { readFile, readdir } from "node:fs/promises";

export async function loadJson(fileName: string, path: string = "./personaData/profiles") {
    try {
        const data = await readFile(`${path}/${fileName}`, "utf8");
        return JSON.parse(data)
    } catch (e) {
        throw new Error(`Error reading/parsing Json for file path '${fileName}'\n${e}`)
    }
}

export async function loadTextPrompt(fileName: string, path = "./prompts") {
    const filePath = path + "/" + fileName
    try {
        const text = await readFile(filePath, "utf8")
        // console.log(text)
        return text
    } catch (e) {
        throw new Error(`Error reading file from path '${filePath}'\n${e}`)
    }
}

export async function loadAllPersonas(path: string = "./personaData/profiles"): Promise<Persona[]> {
    let personas: Persona[] = []
    const entries = await readdir(path, { withFileTypes: true })
    for (const f of entries) {
        if(!f.isFile()) continue
        if(!f.name.endsWith(".json")) continue
        const json = await loadJson(f.name, path)
        personas.push(json as Persona) // very unsafe way of doing this.
    }
    return personas
}
