import { Module } from '@nestjs/common';
import { MenuController } from './menu.controller';
import { ModifierGroupController, ModifierController } from './controllers/modifier-group.controller';
import { MenuService } from './menu.service';
import { ModifierGroupService } from './services/modifier-group.service';
import { ModifierService } from './services/modifier.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
    imports: [DatabaseModule],
    controllers: [MenuController, ModifierGroupController, ModifierController],
    providers: [MenuService, ModifierGroupService, ModifierService],
    exports: [MenuService, ModifierGroupService, ModifierService],
})
export class MenuModule { }

