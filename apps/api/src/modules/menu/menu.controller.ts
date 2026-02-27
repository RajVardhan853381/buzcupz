import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    UseGuards,
    HttpCode,
    HttpStatus,
    Put,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { MenuService } from './menu.service';
import { ModifierGroupService } from './services/modifier-group.service';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { AssignModifierGroupsDto, AssignModifierGroupDto } from './dto/modifier-group.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Menu')
@Controller('menu')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MenuController {
    constructor(
        private readonly service: MenuService,
        private readonly modifierGroupService: ModifierGroupService,
    ) { }

    // ============================================
    // MENU ITEMS
    // ============================================

    @Get('items')
    @ApiOperation({ summary: 'Get all menu items' })
    async getItems(@CurrentUser('restaurantId') restaurantId: string) {
        return this.service.findAllItems(restaurantId);
    }

    @Get('items/:id')
    @ApiOperation({ summary: 'Get menu item by ID' })
    @ApiParam({ name: 'id', description: 'Menu item ID' })
    async getItem(
        @Param('id') id: string,
        @CurrentUser('restaurantId') restaurantId: string,
    ) {
        return this.service.findItemById(id, restaurantId);
    }

    @Get('items/:id/with-modifiers')
    @ApiOperation({ summary: 'Get menu item with full modifier details' })
    @ApiParam({ name: 'id', description: 'Menu item ID' })
    async getItemWithModifiers(
        @Param('id') id: string,
    ) {
        return this.service.findOneWithModifiers(id);
    }

    @Post('items')
    @UseGuards(RolesGuard)
    @Roles('ADMIN', 'MANAGER')
    @ApiOperation({ summary: 'Create menu item' })
    async createItem(
        @Body() dto: CreateMenuItemDto,
        @CurrentUser('restaurantId') restaurantId: string,
    ) {
        return this.service.createItem(dto, restaurantId);
    }

    @Patch('items/:id')
    @UseGuards(RolesGuard)
    @Roles('ADMIN', 'MANAGER')
    @ApiOperation({ summary: 'Update menu item' })
    @ApiParam({ name: 'id', description: 'Menu item ID' })
    async updateItem(
        @Param('id') id: string,
        @Body() dto: UpdateMenuItemDto,
        @CurrentUser('restaurantId') restaurantId: string,
    ) {
        return this.service.updateItem(id, dto, restaurantId);
    }

    @Delete('items/:id')
    @UseGuards(RolesGuard)
    @Roles('ADMIN', 'MANAGER')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Delete menu item' })
    @ApiParam({ name: 'id', description: 'Menu item ID' })
    async deleteItem(
        @Param('id') id: string,
        @CurrentUser('restaurantId') restaurantId: string,
    ) {
        return this.service.deleteItem(id, restaurantId);
    }

    @Patch('items/:id/availability')
    @UseGuards(RolesGuard)
    @Roles('ADMIN', 'MANAGER', 'STAFF')
    @ApiOperation({ summary: 'Toggle item availability' })
    @ApiParam({ name: 'id', description: 'Menu item ID' })
    async toggleAvailability(
        @Param('id') id: string,
        @Body('isAvailable') isAvailable: boolean,
        @CurrentUser('restaurantId') restaurantId: string,
    ) {
        return this.service.toggleAvailability(id, isAvailable, restaurantId);
    }

    // ============================================
    // CATEGORIES
    // ============================================

    @Get('categories')
    @ApiOperation({ summary: 'Get all categories with menu items' })
    async getCategories(@CurrentUser('restaurantId') restaurantId: string) {
        return this.service.findAllCategories(restaurantId);
    }

    @Get('categories/:id')
    @ApiOperation({ summary: 'Get category by ID' })
    @ApiParam({ name: 'id', description: 'Category ID' })
    async getCategory(
        @Param('id') id: string,
        @CurrentUser('restaurantId') restaurantId: string,
    ) {
        return this.service.findCategoryById(id, restaurantId);
    }

    @Post('categories')
    @UseGuards(RolesGuard)
    @Roles('ADMIN', 'MANAGER')
    @ApiOperation({ summary: 'Create category' })
    async createCategory(
        @Body() dto: CreateCategoryDto,
        @CurrentUser('restaurantId') restaurantId: string,
    ) {
        return this.service.createCategory(dto, restaurantId);
    }

    @Patch('categories/:id')
    @UseGuards(RolesGuard)
    @Roles('ADMIN', 'MANAGER')
    @ApiOperation({ summary: 'Update category' })
    @ApiParam({ name: 'id', description: 'Category ID' })
    async updateCategory(
        @Param('id') id: string,
        @Body() dto: Partial<CreateCategoryDto>,
        @CurrentUser('restaurantId') restaurantId: string,
    ) {
        return this.service.updateCategory(id, dto, restaurantId);
    }

    @Delete('categories/:id')
    @UseGuards(RolesGuard)
    @Roles('ADMIN', 'MANAGER')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Delete category' })
    @ApiParam({ name: 'id', description: 'Category ID' })
    async deleteCategory(
        @Param('id') id: string,
        @CurrentUser('restaurantId') restaurantId: string,
    ) {
        return this.service.deleteCategory(id, restaurantId);
    }

    // ============================================
    // MODIFIER MANAGEMENT
    // ============================================

    @Get('items/:id/modifiers')
    @ApiOperation({ summary: 'Get modifier groups for a menu item' })
    async getModifierGroups(@Param('id') id: string) {
        return this.modifierGroupService.findByMenuItemId(id);
    }

    @Put('items/:id/modifiers')
    @UseGuards(RolesGuard)
    @Roles('ADMIN', 'MANAGER')
    @ApiOperation({ summary: 'Replace all modifier groups for a menu item' })
    async assignModifierGroups(
        @Param('id') id: string,
        @Body() dto: AssignModifierGroupsDto
    ) {
        return this.service.assignModifierGroups(id, dto);
    }

    @Post('items/:id/modifiers')
    @UseGuards(RolesGuard)
    @Roles('ADMIN', 'MANAGER')
    @ApiOperation({ summary: 'Add a modifier group to a menu item' })
    async addModifierGroup(
        @Param('id') id: string,
        @Body() dto: AssignModifierGroupDto
    ) {
        return this.service.addModifierGroup(id, dto);
    }

    @Delete('items/:id/modifiers/:groupId')
    @UseGuards(RolesGuard)
    @Roles('ADMIN', 'MANAGER')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Remove a modifier group from a menu item' })
    async removeModifierGroup(
        @Param('id') id: string,
        @Param('groupId') groupId: string
    ) {
        await this.service.removeModifierGroup(id, groupId);
    }

    @Patch('items/:id/modifiers/:groupId')
    @UseGuards(RolesGuard)
    @Roles('ADMIN', 'MANAGER')
    @ApiOperation({ summary: 'Update modifier group assignment settings' })
    async updateModifierGroupAssignment(
        @Param('id') id: string,
        @Param('groupId') groupId: string,
        @Body() dto: Partial<AssignModifierGroupDto>
    ) {
        return this.service.updateModifierGroupAssignment(id, groupId, dto);
    }

    @Post('items/:id/modifiers/reorder')
    @UseGuards(RolesGuard)
    @Roles('ADMIN', 'MANAGER')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Reorder modifier groups for a menu item' })
    async reorderModifierGroups(
        @Param('id') id: string,
        @Body() body: { groupIds: string[] }
    ) {
        return this.service.reorderModifierGroups(id, body.groupIds);
    }

    @Post('items/:id/modifiers/copy-from/:sourceId')
    @UseGuards(RolesGuard)
    @Roles('ADMIN', 'MANAGER')
    @ApiOperation({ summary: 'Copy modifier groups from another menu item' })
    async copyModifiersFromItem(
        @Param('id') id: string,
        @Param('sourceId') sourceId: string
    ) {
        return this.service.copyModifiersFromItem(id, sourceId);
    }
}

