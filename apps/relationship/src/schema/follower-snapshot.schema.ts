import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'follower_snapshots' })
export class FollowerSnapshot extends Document {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  user_id: Types.ObjectId;

  @Prop({ required: true, type: [Types.ObjectId], ref: 'User' })
  followers: Types.ObjectId[];

  @Prop({ required: true, type: Number })
  followers_number: number;

  @Prop({ required: true, type: Date, default: Date.now })
  snapshot_at: Date;
}

export const FollowerSnapshotSchema =
  SchemaFactory.createForClass(FollowerSnapshot);
