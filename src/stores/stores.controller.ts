import { Controller } from "@nestjs/common";

import { StoresService } from "./stores.service";
import { Get } from "@nestjs/common";



@Controller('stores')
export class StoresController {
    constructor(private readonly storesService: StoresService) {}

    //lấy tất cả cửa hàng
    @Get()
    async findAllStores() {
        return this.storesService.findAllStores();
    }
}