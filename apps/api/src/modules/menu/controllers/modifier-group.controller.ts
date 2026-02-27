// apps/api/src/modules/menu/controllers/modifier-group.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { ModifierGroupService } from "../services/modifier-group.service";
import { ModifierService } from "../services/modifier.service";
import {
  CreateModifierGroupDto,
  UpdateModifierGroupDto,
  ModifierGroupQueryDto,
  CloneModifierGroupDto,
  ReorderModifierGroupsDto,
  CreateModifierDto,
  UpdateModifierDto,
  BulkCreateModifiersDto,
  ReorderModifiersDto,
  ModifierGroupResponseDto,
  ModifierResponseDto,
} from "../dto/modifier-group.dto";

@ApiTags("Modifier Groups")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("modifier-groups")
export class ModifierGroupController {
  constructor(
    private readonly modifierGroupService: ModifierGroupService,
    private readonly modifierService: ModifierService,
  ) {}

  // ============================================
  // MODIFIER GROUPS
  // ============================================

  @Post()
  @ApiOperation({ summary: "Create a new modifier group" })
  @ApiResponse({ status: 201, type: ModifierGroupResponseDto })
  async create(@Body() dto: CreateModifierGroupDto) {
    return this.modifierGroupService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: "Get all modifier groups" })
  @ApiResponse({ status: 200, type: [ModifierGroupResponseDto] })
  async findAll(@Query() query: ModifierGroupQueryDto) {
    return this.modifierGroupService.findAll(query);
  }

  @Get("stats")
  @ApiOperation({ summary: "Get modifier group statistics" })
  async getStats() {
    return this.modifierGroupService.getStats();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a modifier group by ID" })
  @ApiResponse({ status: 200, type: ModifierGroupResponseDto })
  @ApiParam({ name: "id", description: "Modifier group ID" })
  async findOne(@Param("id") id: string) {
    return this.modifierGroupService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a modifier group" })
  @ApiResponse({ status: 200, type: ModifierGroupResponseDto })
  async update(@Param("id") id: string, @Body() dto: UpdateModifierGroupDto) {
    return this.modifierGroupService.update(id, dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a modifier group" })
  async remove(@Param("id") id: string) {
    await this.modifierGroupService.remove(id);
  }

  @Post(":id/clone")
  @ApiOperation({ summary: "Clone a modifier group" })
  @ApiResponse({ status: 201, type: ModifierGroupResponseDto })
  async clone(@Param("id") id: string, @Body() dto: CloneModifierGroupDto) {
    return this.modifierGroupService.clone(id, dto);
  }

  @Post("reorder")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Reorder modifier groups" })
  async reorder(@Body() dto: ReorderModifierGroupsDto) {
    await this.modifierGroupService.reorder(dto);
  }

  @Post("bulk-toggle")
  @ApiOperation({ summary: "Bulk toggle active status" })
  async bulkToggle(@Body() body: { ids: string[]; isActive: boolean }) {
    const count = await this.modifierGroupService.bulkToggleActive(
      body.ids,
      body.isActive,
    );
    return { updated: count };
  }

  // ============================================
  // MODIFIERS (Nested under groups)
  // ============================================

  @Get(":groupId/modifiers")
  @ApiOperation({ summary: "Get all modifiers in a group" })
  @ApiResponse({ status: 200, type: [ModifierResponseDto] })
  async getModifiers(@Param("groupId") groupId: string) {
    return this.modifierService.findByGroupId(groupId);
  }

  @Post(":groupId/modifiers")
  @ApiOperation({ summary: "Add a modifier to a group" })
  @ApiResponse({ status: 201, type: ModifierResponseDto })
  async createModifier(
    @Param("groupId") groupId: string,
    @Body() dto: CreateModifierDto,
  ) {
    return this.modifierService.create(groupId, dto);
  }

  @Post(":groupId/modifiers/bulk")
  @ApiOperation({ summary: "Bulk create modifiers" })
  @ApiResponse({ status: 201, type: [ModifierResponseDto] })
  async bulkCreateModifiers(
    @Param("groupId") groupId: string,
    @Body() dto: { modifiers: CreateModifierDto[] },
  ) {
    return this.modifierService.bulkCreate({
      groupId,
      modifiers: dto.modifiers,
    });
  }

  @Post(":groupId/modifiers/reorder")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Reorder modifiers in a group" })
  async reorderModifiers(
    @Param("groupId") groupId: string,
    @Body() dto: ReorderModifiersDto,
  ) {
    await this.modifierService.reorder(groupId, dto);
  }
}

// ============================================
// SEPARATE MODIFIER CONTROLLER
// ============================================
@ApiTags("Modifiers")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("modifiers")
export class ModifierController {
  constructor(private readonly modifierService: ModifierService) {}

  @Get(":id")
  @ApiOperation({ summary: "Get a modifier by ID" })
  @ApiResponse({ status: 200, type: ModifierResponseDto })
  async findOne(@Param("id") id: string) {
    return this.modifierService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update a modifier" })
  @ApiResponse({ status: 200, type: ModifierResponseDto })
  async update(@Param("id") id: string, @Body() dto: UpdateModifierDto) {
    return this.modifierService.update(id, dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a modifier" })
  async remove(@Param("id") id: string) {
    await this.modifierService.remove(id);
  }

  @Post(":id/toggle-availability")
  @ApiOperation({ summary: "Toggle modifier availability" })
  @ApiResponse({ status: 200, type: ModifierResponseDto })
  async toggleAvailability(@Param("id") id: string) {
    return this.modifierService.toggleAvailability(id);
  }

  @Post(":id/set-default")
  @ApiOperation({ summary: "Set modifier as default in its group" })
  async setAsDefault(@Param("id") id: string) {
    const modifier = await this.modifierService.findOne(id);
    await this.modifierService.setAsDefault(id, modifier.groupId);
    return { success: true };
  }

  @Post("bulk-toggle")
  @ApiOperation({ summary: "Bulk toggle modifier availability" })
  async bulkToggle(@Body() body: { ids: string[]; isAvailable: boolean }) {
    const count = await this.modifierService.bulkToggleAvailability(
      body.ids,
      body.isAvailable,
    );
    return { updated: count };
  }

  @Delete("bulk")
  @ApiOperation({ summary: "Bulk delete modifiers" })
  async bulkRemove(@Body() body: { ids: string[] }) {
    const count = await this.modifierService.bulkRemove(body.ids);
    return { deleted: count };
  }
}
