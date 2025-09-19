import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { BaseHttpClient } from './base-http.client';
import { Response } from '../../interfaces/response.interface';
import { AxiosRequestConfig } from 'axios';

// Wallet Service Interfaces
export interface GenerateLoginChallengeRequest {
  address: string;
}

export interface ValidateLoginChallengeRequest {
  address: string;
  signature: string;
  fingerprint_hashed: string;
}
