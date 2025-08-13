import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'sessions' })
export class Session extends Document {
  @Prop({ required: true, index: true })
  user_id: Types.ObjectId;

  @Prop({ required: true, index: true })
  device_fingerprint_id: Types.ObjectId;

  @Prop({ required: true })
  token: string;
}

export const SessionSchema = SchemaFactory.createForClass(Session);
