import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'device_fingerprints' })
export class DeviceFingerprint extends Document {
  @Prop({ required: true, index: true })
  user_id: Types.ObjectId;

  @Prop({ required: false })
  device: string;

  @Prop({ required: false })
  browser: string;

  @Prop({ required: true, index: true })
  fingerprint_hashed: string;

  @Prop({ required: true, default: true })
  is_trusted: boolean;
}

export const DeviceFingerprintSchema =
  SchemaFactory.createForClass(DeviceFingerprint);
