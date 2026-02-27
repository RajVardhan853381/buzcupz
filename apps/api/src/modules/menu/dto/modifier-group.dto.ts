import {
  ApiProperty,
  ApiPropertyOptional,
  PartialType,
  OmitType,
} from "@nestjs/swagger";
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  IsBoolean,
  IsEnum,
  IsArray,
  ValidateNested,
  IsObject,
  ArrayMinSize,
} from "class-validator";
import { Type, Transform } from "class-transformer";
import { ModifierSelectionType, ModifierDisplayStyle } from "@prisma/client";

// ============================================
// MODIFIER DTO
// ============================================
export class CreateModifierDto {
  @ApiProperty({ example: "Large" })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: "Large Size (+$2)" })
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiPropertyOptional({ example: "Upgrade to our large 20oz size" })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 2.0, description: "Price adjustment" })
  @Type(() => Number)
  @IsOptional()
  priceAdjustment?: number = 0;

  @ApiPropertyOptional({
    enum: ["FIXED", "PERCENTAGE", "REPLACEMENT", "FREE", "QUANTITY_BASED"],
  })
  @IsOptional()
  @IsEnum(["FIXED", "PERCENTAGE", "REPLACEMENT", "FREE", "QUANTITY_BASED"])
  priceType?: string = "FIXED";

  @ApiPropertyOptional({
    example: 10,
    description: "For percentage-based pricing",
  })
  @IsOptional()
  @Type(() => Number)
  percentageValue?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number = 0;

  @ApiPropertyOptional({ example: "https://example.com/large.jpg" })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ example: "#FF5733" })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean = false;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean = true;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isPremium?: boolean = false;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isPopular?: boolean = false;

  // Quantity-based modifiers
  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  minQuantity?: number = 0;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxQuantity?: number = 10;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  defaultQuantity?: number = 0;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  quantityStep?: number = 1;

  @ApiPropertyOptional({
    example: 0.5,
    description: "Price per additional unit",
  })
  @IsOptional()
  @Type(() => Number)
  pricePerQuantity?: number;

  @ApiPropertyOptional({ example: 1, description: "First N units are free" })
  @IsOptional()
  @IsInt()
  @Min(0)
  freeQuantity?: number = 0;

  // Inventory
  @ApiPropertyOptional({ description: "Link to inventory item" })
  @IsOptional()
  @IsString()
  inventoryItemId?: string;

  @ApiPropertyOptional({
    example: 0.1,
    description: "Amount to deduct from inventory",
  })
  @IsOptional()
  @Type(() => Number)
  deductQuantity?: number;

  // Nutritional
  @ApiPropertyOptional({ example: 150 })
  @IsOptional()
  @IsInt()
  @Min(0)
  calories?: number;

  @ApiPropertyOptional({ type: [String], example: ["MILK", "EGGS"] })
  @IsOptional()
  @IsArray()
  allergens?: string[];
}

export class UpdateModifierDto extends PartialType(CreateModifierDto) {}

// ============================================
// MODIFIER GROUP DTO
// ============================================
export class CreateModifierGroupDto {
  @ApiProperty({ example: "size" })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: "Choose Your Size" })
  @IsString()
  @IsNotEmpty()
  displayName: string;

  @ApiPropertyOptional({ example: "Select the size for your drink" })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: ModifierSelectionType, default: "SINGLE" })
  @IsEnum(ModifierSelectionType)
  selectionType: ModifierSelectionType = ModifierSelectionType.SINGLE;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  minSelections?: number = 0;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxSelections?: number = 1;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean = false;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number = 0;

  @ApiPropertyOptional({ enum: ModifierDisplayStyle, default: "LIST" })
  @IsOptional()
  @IsEnum(ModifierDisplayStyle)
  displayStyle?: ModifierDisplayStyle = ModifierDisplayStyle.LIST;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  showPrices?: boolean = true;

  @ApiPropertyOptional({ description: "ID of default selected modifier" })
  @IsOptional()
  @IsString()
  defaultModifierId?: string;

  @ApiPropertyOptional({ description: "Conditional display rules" })
  @IsOptional()
  @IsObject()
  conditionalLogic?: Record<string, any>;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @ApiPropertyOptional({ description: "Parent modifier ID for nested groups" })
  @IsOptional()
  @IsString()
  parentModifierId?: string;

  @ApiPropertyOptional({
    type: [CreateModifierDto],
    description: "Modifiers to create with the group",
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateModifierDto)
  modifiers?: CreateModifierDto[];
}

export class UpdateModifierGroupDto extends PartialType(
  OmitType(CreateModifierGroupDto, ["modifiers"] as const),
) {}

// ============================================
// MODIFIER GROUP ASSIGNMENT DTO
// ============================================
export class AssignModifierGroupDto {
  @ApiProperty({ description: "Modifier group ID" })
  @IsString()
  @IsNotEmpty()
  modifierGroupId: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number = 0;

  @ApiPropertyOptional({
    description: "Override isRequired for this menu item",
  })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @ApiPropertyOptional({ description: "Override minSelections" })
  @IsOptional()
  @IsInt()
  @Min(0)
  minSelections?: number;

  @ApiPropertyOptional({ description: "Override maxSelections" })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxSelections?: number;

  @ApiPropertyOptional({
    description: "Price overrides for specific modifiers",
    example: { "modifier-id-1": 2.5, "modifier-id-2": 3.0 },
  })
  @IsOptional()
  @IsObject()
  priceOverrides?: Record<string, number>;
}

export class AssignModifierGroupsDto {
  @ApiProperty({ type: [AssignModifierGroupDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssignModifierGroupDto)
  groups: AssignModifierGroupDto[];
}

// ============================================
// BULK OPERATIONS DTO
// ============================================
export class BulkCreateModifiersDto {
  @ApiProperty({ description: "Modifier group ID" })
  @IsString()
  @IsNotEmpty()
  groupId: string;

  @ApiProperty({ type: [CreateModifierDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateModifierDto)
  modifiers: CreateModifierDto[];
}

export class ReorderModifiersDto {
  @ApiProperty({
    description: "Array of modifier IDs in desired order",
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  modifierIds: string[];
}

export class ReorderModifierGroupsDto {
  @ApiProperty({
    description: "Array of modifier group IDs in desired order",
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  groupIds: string[];
}

// ============================================
// CLONE/DUPLICATE DTO
// ============================================
export class CloneModifierGroupDto {
  @ApiProperty({ example: "Size Options (Copy)" })
  @IsString()
  @IsNotEmpty()
  newName: string;

  @ApiPropertyOptional({ default: true, description: "Also clone modifiers" })
  @IsOptional()
  @IsBoolean()
  includeModifiers?: boolean = true;
}

// ============================================
// QUERY/FILTER DTO
// ============================================
export class ModifierGroupQueryDto {
  @ApiPropertyOptional({ description: "Search by name" })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: "Filter by active status" })
  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: "Filter by selection type" })
  @IsOptional()
  @IsEnum(ModifierSelectionType)
  selectionType?: ModifierSelectionType;

  @ApiPropertyOptional({ description: "Include modifiers in response" })
  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true)
  @IsBoolean()
  includeModifiers?: boolean = true;

  @ApiPropertyOptional({ description: "Include linked menu items count" })
  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true)
  @IsBoolean()
  includeMenuItemsCount?: boolean = false;
}

// ============================================
// RESPONSE DTOs
// ============================================
export class ModifierResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  displayName: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  priceAdjustment: number;

  @ApiProperty()
  priceType: string;

  @ApiPropertyOptional()
  percentageValue?: number;

  @ApiProperty()
  sortOrder: number;

  @ApiPropertyOptional()
  imageUrl?: string;

  @ApiPropertyOptional()
  color?: string;

  @ApiProperty()
  isDefault: boolean;

  @ApiProperty()
  isAvailable: boolean;

  @ApiProperty()
  isPremium: boolean;

  @ApiProperty()
  isPopular: boolean;

  @ApiPropertyOptional()
  minQuantity?: number;

  @ApiPropertyOptional()
  maxQuantity?: number;

  @ApiPropertyOptional()
  defaultQuantity?: number;

  @ApiPropertyOptional()
  calories?: number;

  @ApiPropertyOptional()
  allergens?: string[];

  @ApiPropertyOptional({ type: () => [ModifierGroupResponseDto] })
  nestedGroups?: ModifierGroupResponseDto[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class ModifierGroupResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  displayName: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty({ enum: ModifierSelectionType })
  selectionType: ModifierSelectionType;

  @ApiProperty()
  minSelections: number;

  @ApiProperty()
  maxSelections: number;

  @ApiProperty()
  isRequired: boolean;

  @ApiProperty()
  sortOrder: number;

  @ApiProperty({ enum: ModifierDisplayStyle })
  displayStyle: ModifierDisplayStyle;

  @ApiProperty()
  showPrices: boolean;

  @ApiPropertyOptional()
  defaultModifierId?: string;

  @ApiProperty()
  isActive: boolean;

  @ApiPropertyOptional({ type: [ModifierResponseDto] })
  modifiers?: ModifierResponseDto[];

  @ApiPropertyOptional()
  menuItemsCount?: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
