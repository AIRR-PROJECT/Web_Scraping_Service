import { Module } from '@nestjs/common';
import { LangChainController } from './langchain.controller';
import { LangChainService } from './langchain.service';

@Module({
  controllers: [LangChainController],
  providers: [LangChainService]
})

export class LangChainModule {}