import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateInventoryItemDto } from './create-inventory-item.dto';

export class UpdateInventoryItemDto extends PartialType(
    OmitType(CreateInventoryItemDto, ['sku'] as const),
) { }
