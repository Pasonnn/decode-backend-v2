import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, ObjectId } from 'mongoose';

@Schema({ timestamps: true })
export class DeviceFingerprint extends Document {
  @Prop({ required: true, index: true })
  user_id: ObjectId;

  @Prop({ required: true, index: true })
  fingerprint_hash: string;

  @Prop({ required: true, default: true })
  is_trusted: boolean;
}

export const DeviceFingerprintSchema = SchemaFactory.createForClass(DeviceFingerprint);
