import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth.module';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { TokenDto } from '../dto/token.dto';
import { setupLogger } from '../../test/setup-logger';
import { Configuration } from '../configuration';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;

  beforeEach(async () => {
    setupLogger();
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService],
      imports: [
        ConfigModule.forRoot({
          load: [
            () => {
              return {
                AM_CRYPTO_JWT_SECRET: 'secret',
                AM_CRYPTO_JWT_EXPIRES: '60s',
              };
            },
          ],
        }),
        JwtModule.registerAsync({
          imports: [ConfigModule],
          useFactory: (configService: ConfigService<Configuration>) => {
            return {
              secret: configService.get('AM_CRYPTO_JWT_SECRET'),
              signOptions: {
                expiresIn: configService.get('AM_CRYPTO_JWT_EXPIRES'),
              },
            };
          },
          inject: [ConfigService],
        }),
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should correctly create a JWT token', async () => {
    const token = service.login('user');
    expect(token).not.toBeNull();
    expect(
      ((await jwtService.verifyAsync(token.token)) as any).username,
    ).toEqual('user');
    expect((jwtService.decode(token.token) as any).username).toEqual('user');
  });
});
