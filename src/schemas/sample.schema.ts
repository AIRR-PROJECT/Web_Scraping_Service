import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Model } from "mongoose";

export type SampleDocument = HydratedDocument<Sample>; // Export type để define type cho các query result

@Schema({
  collection: 'sample', // Tên collection trong MongoDB
  timestamps: { // Default tự tạo 2 field createdAt và updatedAt
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
})
export class Sample extends Model{
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  age: number;

  @Prop({ required: true })
  email: string;
}

export const SampleSchema = SchemaFactory.createForClass(Sample); // Export schema để sử dụng trong service