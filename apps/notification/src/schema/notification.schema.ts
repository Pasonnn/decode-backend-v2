import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'notifications' })
export class Notification extends Document {
  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date })
  updatedAt: Date;
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  user_id: Types.ObjectId;

  @Prop({ required: true })
  type: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  message: string;

  @Prop({ required: false, default: false })
  delivered: boolean;

  @Prop({ required: false, default: null })
  delivered_at: Date;

  @Prop({ required: false, default: false })
  read: boolean;

  @Prop({ required: false, default: null })
  read_at: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
