interface SkillSet {
    skillname: string;
    proficiency: number;
    year_experience: number;
}

export interface JobSuggestionDto {
    choice: number; // 1: only question, 2: only skillset, 3: both
    questions?: string[];
}

export interface PostData {
    title: string;
    tags: string[];
    link: string;
    reactions: number;
    content?: string;
    cmt: number;
}
