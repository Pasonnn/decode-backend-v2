import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export enum Interest {
  // 👥 Social & Community
  NETWORKING = 'networking',
  CREATOR_ECONOMY = 'creator_economy',
  SOCIAL_TOKENS = 'social_tokens',
  COMMUNITY_BUILDING = 'community_building',
  ONLINE_GAMING = 'online_gaming',
  DIGITAL_COLLECTIBLES = 'digital_collectibles',
  METAVERSE = 'metaverse',
  MEMES = 'memes',
  DEFI = 'defi',
  DAO = 'dao',
  SECURITY = 'security',

  // 💼 Career & Growth
  STARTUPS = 'startups',
  TECH_INNOVATION = 'tech_innovation',
  ENTREPRENEURSHIP = 'entrepreneurship',
  FREELANCING = 'freelancing',
  OPEN_SOURCE = 'open_source',
  RESEARCH_LEARNING = 'research_learning',
  CODING_DEVELOPMENT = 'coding_development',

  // 🎨 Lifestyle & Hobbies
  MUSIC = 'music',
  ANIME_MANGA = 'anime_manga',
  ESPORTS = 'esports',
  FITNESS = 'fitness',
  SPORT = 'sport',
  MOVIES = 'movies',
  TRAVEL = 'travel',
  FOOD_COOKING = 'food_cooking',
  FASHION_STYLE = 'fashion_style',

  // 📈 Finance & Future
  INVESTING = 'investing',
  TRADING = 'trading',
  CRYPTO_ARBITRAGE = 'crypto_arbitrage',
  PERSONAL_FINANCE = 'personal_finance',
  GLOBAL_ECONOMY = 'global_economy',
  AI = 'ai',
  SUSTAINABILITY = 'sustainability',

  OTHER = 'other',
}

export class InterestDto {
  @IsEnum(Interest)
  @IsNotEmpty()
  @IsString()
  @IsArray()
  @IsOptional()
  interests: Interest[];
}

export class CreateUserInterestsDto {
  @IsArray()
  @IsNotEmpty()
  @IsEnum(Interest, { each: true })
  interest: Interest[];
}

export class GetInterestSuggestUserPaginatedDto {
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  page: number;
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  limit: number;
}
