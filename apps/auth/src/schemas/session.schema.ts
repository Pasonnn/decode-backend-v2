import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'sessions' })
export class Session extends Document {
  @Prop({ required: true, index: true })
  user_id: Types.ObjectId;

  @Prop({ required: true, index: true })
  device_fingerprint_id: Types.ObjectId;

  @Prop({ required: true })
  session_token: string;

  @Prop({ default: 'Decode' })
  app: string;

  @Prop({ required: true, default: Date.now() + 1000 * 60 * 60 * 24 * 30 })
  expires_at: Date;

  @Prop({ required: true, default: true })
  is_active: boolean;

  @Prop({ required: false })
  revoked_at: Date;
}

export const SessionSchema = SchemaFactory.createForClass(Session);
