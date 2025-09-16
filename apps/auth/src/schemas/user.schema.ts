import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, collection: 'users' })
export class User extends Document {
  @Prop({ required: true, unique: true, index: true })
  username: string;

  @Prop({ required: true, unique: true, index: true })
  email: string;

  @Prop({ required: false })
  display_name: string;

  @Prop({ required: true })
  password_hashed: string;

  @Prop({ required: false, default: 'Hi, i am a new Decode User' })
  bio: string;

  @Prop({
    required: false,
    default: 'bafkreibmridohwxgfwdrju5ixnw26awr22keihoegdn76yymilgsqyx4le',
  })
  avatar_ipfs_hash: string;

  @Prop({
    required: false,
    default: 'user',
    enum: ['user', 'admin', 'moderator'],
  })
  role: string;

  @Prop({ required: false, default: new Date() })
  last_login: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
