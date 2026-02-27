import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { JwtAuthGuard } from "@/common/guards/jwt-auth.guard";
import { TablesService } from "./tables.service";

@ApiTags("Tables")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("tables")
export class TablesController {
  constructor(private readonly tablesService: TablesService) {}

  @Get()
  @ApiOperation({ summary: "Get all tables" })
  async findAll(@Query("section") section?: string) {
    return this.tablesService.findAll(section);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a table by ID" })
  async findOne(@Param("id") id: string) {
    return this.tablesService.findOne(id);
  }

  @Get(":id/availability")
  @ApiOperation({ summary: "Get table availability for a date" })
  async getAvailability(@Param("id") id: string, @Query("date") date: string) {
    return this.tablesService.getTableAvailability(id, date);
  }
}
