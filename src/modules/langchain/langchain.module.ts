import { Module } from '@nestjs/common';
import { LangchainController } from './langchain.controller';
import { LangchainService } from './langchain.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Sample, SampleSchema } from 'src/schemas/sample.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Sample.name, schema: SampleSchema}
    ])
  ],
  controllers: [LangchainController],
  providers: [LangchainService]
})
export class LangchainModule {}
