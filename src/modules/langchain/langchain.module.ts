import { Module } from '@nestjs/common';
import { LangChainController } from './langchain.controller';
import { LangChainService } from './langchain.service';
import { MongooseModule } from '@nestjs/mongoose';
import { BlogSummarize, BlogSummarizeSchema } from 'src/schemas/blog_summarize.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BlogSummarize.name, schema: BlogSummarizeSchema}
    ])
  ],
  controllers: [LangChainController],
  providers: [LangChainService]
})

export class LangChainModule {}