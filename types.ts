export type ServerResponse = {
    type: string,
    body: any
}

export type CharacterProfile = {
    name: string;
    comment: string;
    system: string;
    persona: {
        name: string;
        personality: string;
        motivations: string;
        speechStyle: string;
        facts: string[];
    };
};