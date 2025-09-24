import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { BaseHttpClient } from './base-http.client';
import { Response } from '../../interfaces/response.interface';
import { ServicesJwtStrategy } from '../../strategies/services-jwt.strategy';
import {
  CheckUserExistsByEmailOrUsernameDto,
  CreateUserDto,
  ChangePasswordDto,
  GetInfoByEmailOrUsernameDto,
  GetInfoByUserIdDto,
  GetInfoWithPasswordByUserEmailOrUsernameDto,
  UpdateUserLastLoginDto,
  GetInfoWithPasswordByUserIdDto,
} from '../../dto/user-services-response.dto';
import { UserDoc } from '../../interfaces/user-doc.interface';

@Injectable()
export class UserServiceClient extends BaseHttpClient {
  constructor(
    private readonly configService: ConfigService,
    httpService: HttpService,
    private readonly servicesJwtStrategy: ServicesJwtStrategy,
  ) {
    super(
      httpService,
      configService.get<string>('services.user.url') || 'http://localhost:4002',
    );
  }

  async checkUserExistsByEmailOrUsername(
    data: CheckUserExistsByEmailOrUsernameDto,
  ): Promise<Response> {
    const services_token = this.servicesJwtStrategy.createUserServicesToken();
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Auth-Service/1.0',
        Authorization: `Bearer ${services_token}`,
      },
    };
    return this.get(
      '/users/services/user/check-user-exists?email_or_username=' +
        data.email_or_username,
      config,
    );
  }

  async createUser(data: CreateUserDto): Promise<Response> {
    const services_token = this.servicesJwtStrategy.createUserServicesToken();
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Auth-Service/1.0',
        Authorization: `Bearer ${services_token}`,
      },
    };
    return this.post('/users/services/user/create-user', data, config);
  }

  async changePassword(data: ChangePasswordDto): Promise<Response> {
    const services_token = this.servicesJwtStrategy.createUserServicesToken();
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Auth-Service/1.0',
        Authorization: `Bearer ${services_token}`,
      },
    };
    return this.put('/users/services/user/change-password', data, config);
  }

  async getInfoByEmailOrUsername(
    data: GetInfoByEmailOrUsernameDto,
  ): Promise<Response<UserDoc>> {
    const services_token = this.servicesJwtStrategy.createUserServicesToken();
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Auth-Service/1.0',
        Authorization: `Bearer ${services_token}`,
      },
    };
    return this.get(
      '/users/services/user/get-info-by-email-or-username?email_or_username=' +
        data.email_or_username,
      config,
    );
  }

  async getInfoByUserId(data: GetInfoByUserIdDto): Promise<Response<UserDoc>> {
    const services_token = this.servicesJwtStrategy.createUserServicesToken();
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Auth-Service/1.0',
        Authorization: `Bearer ${services_token}`,
      },
    };
    return this.get(
      '/users/services/user/get-info-by-user-id?user_id=' + data.user_id,
      config,
    );
  }

  async getInfoWithPasswordByUserId(
    data: GetInfoWithPasswordByUserIdDto,
  ): Promise<Response<UserDoc>> {
    const services_token = this.servicesJwtStrategy.createUserServicesToken();
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Auth-Service/1.0',
        Authorization: `Bearer ${services_token}`,
      },
    };
    return this.get(
      '/users/services/user/get-info-with-password-by-user-id?user_id=' +
        data.user_id,
      config,
    );
  }

  async getInfoWithPasswordByUserEmailOrUsername(
    data: GetInfoWithPasswordByUserEmailOrUsernameDto,
  ): Promise<Response<UserDoc>> {
    const services_token = this.servicesJwtStrategy.createUserServicesToken();
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Auth-Service/1.0',
        Authorization: `Bearer ${services_token}`,
      },
    };
    return this.get(
      '/users/services/user/get-info-with-password-by-user-email-or-username?email_or_username=' +
        data.email_or_username,
      config,
    );
  }

  async updateUserLastLogin(data: UpdateUserLastLoginDto): Promise<Response> {
    const services_token = this.servicesJwtStrategy.createUserServicesToken();
    const config = {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Auth-Service/1.0',
        Authorization: `Bearer ${services_token}`,
      },
    };
    return this.put(
      '/users/services/user/update-user-last-login',
      data,
      config,
    );
  }
}
