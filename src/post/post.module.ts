import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PostService } from "./post.service";
import { PostController } from "./post.controller";
import { BlogPost, BlogCategory } from "./post.entity";





@Module({
    imports: [
        TypeOrmModule.forFeature([BlogPost, BlogCategory]), 
    ],
    controllers: [PostController],
    providers: [PostService],
    exports: [PostService]
})
export class PostModule {}