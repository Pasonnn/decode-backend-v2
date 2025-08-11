import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, ObjectId } from 'mongoose';

@Schema({ timestamps: true })
export class Session extends Document {
  @Prop({ required: true, index: true })
  user_id: ObjectId;

  @Prop({ required: true, index: true })
  device_fingerprint_id: ObjectId;

  @Prop({ required: true })
  token: string;
}

export const SessionSchema = SchemaFactory.createForClass(Session);
