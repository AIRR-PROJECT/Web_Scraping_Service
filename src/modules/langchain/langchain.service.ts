import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Sample } from 'src/schemas/sample.schema';

@Injectable()
export class LangchainService {
  constructor(
    @InjectModel(Sample.name) 
    private readonly langchainModel: Sample
  ) {}
}
