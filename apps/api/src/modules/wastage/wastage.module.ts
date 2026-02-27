import { Module } from '@nestjs/common';
import { WastageController } from './wastage.controller';
import { WastageService } from './wastage.service';
import { DatabaseModule } from '../../database/database.module';

@Module({
    imports: [DatabaseModule],
    controllers: [WastageController],
    providers: [WastageService],
    exports: [WastageService],
})
export class WastageModule { }
