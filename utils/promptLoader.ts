import { CharacterProfile } from "../types.ts";

export async function loadJson(fileName: string) {
    try {
        const data = await Deno.readTextFile(`./profiles/${fileName}`);
        return JSON.parse(data)
    } catch (e) {
        throw new Error(`Error reading/parsing Json for file path '${fileName}'\n${e}`)
    }
}

export async function loadTextPrompt(fileName: string, path = "./prompts") {
    const filePath = path + "/" + fileName
    try {
        return await Deno.readTextFile(filePath)
    } catch (e) {
        throw new Error(`Error reading file from path '${filePath}'\n${e}`)
    }
}

export function jsonToPrompt(profile: CharacterProfile) {
    const persona = profile.persona
    const factsFormatted = persona.facts.map((f) => `- ${f}`).join('\n')

    return `
Your name is ${persona.name}.
${profile.system}

Personality:
${persona.personality}

Motivations:
${persona.motivations}

Speech Style:
${persona.speechStyle}

Known Facts:
${factsFormatted}
`.trim();
}