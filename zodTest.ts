import { MessageJsonOptionsScheme } from "./messages/index.ts";
import { MessageJSONOptions } from "@dialogic";


const correctMsg: MessageJSONOptions = {
    content: "yay"
}

const incorrectMsg = {
    role: 67
}

const val = MessageJsonOptionsScheme.safeParse(correctMsg)
console.log(val)

console.log("#####")

const inval = MessageJsonOptionsScheme.safeParse(incorrectMsg)
console.log(inval)