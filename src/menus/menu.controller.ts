import { Controller, Get } from '@nestjs/common';
import { MenuService } from './menu.service';
import { Menus } from './Menus.entity';

@Controller('menus')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  // lấy tất cả menu active
  @Get()
  async findAllMenus(): Promise<Menus[]> {
    return await this.menuService.findAllMenus();
  }
}