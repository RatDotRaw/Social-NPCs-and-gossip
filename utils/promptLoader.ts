export async function loadJson(fileName: string) {
    const data = await Deno.readTextFile(`./${fileName}`);
    return JSON.parse(data)
}