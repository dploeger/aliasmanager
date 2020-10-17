import { Test, TestingModule } from '@nestjs/testing';
import { AliasController } from './alias.controller';
import { setupLogger } from '../../test/setup-logger';
import { startContainer, stopContainer } from '../../test/docker-ldap';
import { AccountService } from '../account/account.service';

describe('Alias Controller', () => {
  let controller: AliasController;

  beforeEach(async () => {
    setupLogger();
    await startContainer();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AliasController],
      imports: [AccountService],
    }).compile();

    controller = module.get<AliasController>(AliasController);
  });

  afterEach(async () => {
    await stopContainer();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create an alias');
});
