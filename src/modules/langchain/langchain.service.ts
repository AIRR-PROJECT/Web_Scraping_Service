import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JobSuggestionDto, PostDataDto } from './common/dto/langchain.dto';
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate, FewShotPromptTemplate } from '@langchain/core/prompts';
import { CommaSeparatedListOutputParser } from '@langchain/core/output_parsers';
import { HfInference } from '@huggingface/inference';
import * as fs from 'fs';
import * as path from 'path';
// import { examples_job_suggestion_option1_prompt } from './common/langchain.support';

@Injectable()
export class LangChainService {
    private readonly model: ChatOpenAI;
    private readonly hf: HfInference;

    private tmp_skillsets = [
        {
            skillname: 'Python',
            proficiency: 5,
            year_experience: 5,
        },
        {
            skillname: 'JavaScript',
            proficiency: 4,
            year_experience: 3,
        },
        {
            skillname: 'SQL',
            proficiency: 4,
            year_experience: 4,
        },
        {
            skillname: 'Data Analysis',
            proficiency: 4,
            year_experience: 3,
        },
        {
            skillname: 'Machine Learning',
            proficiency: 3,
            year_experience: 2,
        },
        {
            skillname: 'Git',
            proficiency: 4,
            year_experience: 4,
        },
        {
            skillname: 'Cloud Computing (AWS)',
            proficiency: 3,
            year_experience: 2,
        },
        {
            skillname: 'HTML & CSS',
            proficiency: 4,
            year_experience: 4,
        },
        {
            skillname: 'UX/UI Design',
            proficiency: 3,
            year_experience: 2,
        },
        {
            skillname: 'Security (Cybersecurity)',
            proficiency: 3,
            year_experience: 2,
        },
    ];

    private tmp_questions = [
        'work with computer & tech every day',
        'solve complex problem & create solution',
        'work independently',
        'creative environment',
        'deep skills',
        'work in startups company',
    ];

    constructor(private readonly configService: ConfigService) {
        console.log('LangChainService initialized');
        const openAIapiKey = this.configService.get<string>('OPENAI_API_KEY');
        const hfapiToken = this.configService.get<string>(
            'HUGGINGFACEHUB_API_TOKEN',
        );

        this.model = new ChatOpenAI({
            model: 'gpt-4o-mini',
            temperature: 0,
            configuration: {
                apiKey: openAIapiKey,
                baseURL: 'https://open.keyai.shop/v1',
            },
        });

        this.hf = new HfInference(hfapiToken);
    }

    async jobSuggestion(body: JobSuggestionDto): Promise<any> {
        let user_answers = body.questions.join(', ') || [];
        let skillsets = [];
        if (body.choice === 2 || body.choice === 3) {
            // Fetch skillsets
            skillsets = this.tmp_skillsets;
        }

        // const examplePrompt = PromptTemplate.fromTemplate(
        //     'Tính chất: {question}\nKết quả: {answer}',
        // );

        const output_parsers = new CommaSeparatedListOutputParser();

        const format_instructions = output_parsers.getFormatInstructions();

        // const prompt = new FewShotPromptTemplate({
        //     examples: examples_job_suggestion_option1_prompt,
        //     examplePrompt: examplePrompt,
        //     prefix: 'Hãy giúp tôi tìm 5 công việc trong ngành IT phổ biến ở Việt Nam năm 2024, phù hợp với các tính chất được cung cấp. Tham khảo các ví dụ sau:',
        //     suffix: 'Tính chất: {input}\nHãy sắp xếp kết quả theo mức độ phù hợp giảm dần\n{format_instructions}',
        //     inputVariables: ['input'],
        //     partialVariables: { format_instructions: format_instructions },
        // });

        const prompt = new PromptTemplate({
            template: `Hãy giúp tôi tìm 5 công việc trong ngành IT phổ biến ở Việt Nam trong năm 2024 và tương lai, phù hợp với các tính chất được cung cấp\nTính chất: {input}\nHãy sắp xếp kết quả bằng tiếng anh theo mức độ phù hợp giảm dần\n{format_instructions}`,
            inputVariables: ['input', 'format_instructions'],
        });

        const formatted = await prompt.format({
            input: user_answers,
            format_instructions: format_instructions,
        });

        console.log(formatted.toString());

        const response = await this.model.invoke(formatted.toString());
        return {
            message: 'Job suggestions processed',
            data: response.content.toString(),
            // data: '',
        };
    }

    async blogSummarize(content: PostDataDto[]) {
        // const response = await this.hf.summarization({
        //     model: 'facebook/bart-large-cnn',
        //     inputs: content,
        //     parameters: {
        //         max_length: 100,
        //     },
        // });
        // return response.summary_text;
    }
}
