import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model } from 'mongoose';

export type BlogSummarizeDocument = HydratedDocument<BlogSummarize>;

@Schema({
    collection: 'BlogSummarize', // Tên collection trong MongoDB
    timestamps: {
        // Default tự tạo 2 field createdAt và updatedAt
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    },
})
export class BlogSummarize extends Model {
    @Prop({ required: true })
    title: string;

    @Prop({ required: true })
    tags: string[];

    @Prop({ required: true })
    link: string;

    @Prop({ required: false })
    reactions: number;

    @Prop({ required: true })
    content: string;

    @Prop({ required: false })
    cmt: number;
}

export const BlogSummarizeSchema = SchemaFactory.createForClass(BlogSummarize); // Export schema để sử dụng trong service
