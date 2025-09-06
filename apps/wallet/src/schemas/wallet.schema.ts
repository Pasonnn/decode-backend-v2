import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true, collection: 'wallets' })
export class Wallet extends Document {
  @Prop({ required: true, unique: true, index: true })
  address: string;

  @Prop({ required: true, index: true, ref: 'User' })
  user_id: Types.ObjectId;

  @Prop({ required: false, default: null })
  name_service: string;

  @Prop({ required: false, default: false })
  is_primary: boolean;
}

export const WalletSchema = SchemaFactory.createForClass(Wallet);
