import {
  Controller,
  Post,
  Patch,
  Delete,
  Route,
  SuccessResponse,
  Tags,
  Response,
  Request,
  Path,
  Body,
  Get,
  Security,
} from 'tsoa';
import { injectable, inject } from 'tsyringe';
import { ItemService } from '../services/item.service';
import {
  CreateItemReqDto,
  UpdateItemReqDto,
  ListItemsReqDto,
} from '../dtos/item.req.dto';
import {
  CreateItemResDto,
  UpdateItemResDto,
  DeleteItemResDto,
  CategoriesResDto,
  ListItemsResDto,
  ItemDetailResDto,
} from '../dtos/item.res.dto';
import {
  Result,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  InternalServerError,
} from '../../../common/types/result.type';

@injectable()
@Route('admin/items')
@Tags('Shop(Admin)')
export class AdminItemController extends Controller {
  constructor(@inject(ItemService) private itemService: ItemService) {
    super();
  }

  @SuccessResponse('200', 'OK')
  @Response<BadRequestError>(400, 'Bad Request')
  @Response<UnauthorizedError>(401, 'Unauthorized')
  @Response<ForbiddenError>(403, 'Forbidden')
  @Response<ConflictError>(409, 'Conflict')
  @Response<InternalServerError>(500, 'Internal Server Error')
  @Security('jwt')
  @Post('/')
  public async createItem(
    @Request() req: any,
    @Body() dto: CreateItemReqDto,
  ): Promise<Result<CreateItemResDto>> {
    const result = await this.itemService.createItem(dto);
    this.setStatus(result.statusCode);
    return result;
  }

  @SuccessResponse('200', 'OK')
  @Response<BadRequestError>(400, 'Bad Request')
  @Response<UnauthorizedError>(401, 'Unauthorized')
  @Response<ForbiddenError>(403, 'Forbidden')
  @Response<NotFoundError>(404, 'Not Found')
  @Response<InternalServerError>(500, 'Internal Server Error')
  @Security('jwt')
  @Patch('/{itemId}')
  public async updateItem(
    @Request() req: any,
    @Path() itemId: number,
    @Body() dto: UpdateItemReqDto,
  ): Promise<Result<UpdateItemResDto>> {
    const result = await this.itemService.updateItem({ itemId, ...dto });
    this.setStatus(result.statusCode);
    return result;
  }

  @SuccessResponse('200', 'OK')
  @Response<UnauthorizedError>(401, 'Unauthorized')
  @Response<ForbiddenError>(403, 'Forbidden')
  @Response<NotFoundError>(404, 'Not Found')
  @Response<InternalServerError>(500, 'Internal Server Error')
  @Security('jwt')
  @Delete('/{itemId}')
  public async deleteItem(
    @Request() req: any,
    @Path() itemId: number,
  ): Promise<Result<DeleteItemResDto>> {
    const result = await this.itemService.deleteItem({ itemId });
    this.setStatus(result.statusCode);
    return result;
  }
}

@injectable()
@Route('items')
@Tags('Shop')
export class ItemController extends Controller {
  constructor(@inject(ItemService) private itemService: ItemService) {
    super();
  }

  @SuccessResponse('200', 'OK')
  @Response<InternalServerError>(500, 'Internal Server Error')
  @Get('/categories')
  public async getCategories(): Promise<Result<CategoriesResDto>> {
    const result = await this.itemService.getCategories();
    this.setStatus(result.statusCode);
    return result;
  }

  @SuccessResponse('200', 'OK')
  @Response<BadRequestError>(400, 'Bad Request')
  @Response<InternalServerError>(500, 'Internal Server Error')
  @Post('/')
  public async listItems(
    @Body() dto: ListItemsReqDto,
  ): Promise<Result<ListItemsResDto>> {
    const result = await this.itemService.listItems(dto);
    this.setStatus(result.statusCode);
    return result;
  }

  @SuccessResponse('200', 'OK')
  @Response<BadRequestError>(400, 'Bad Request')
  @Response<NotFoundError>(404, 'Not Found')
  @Response<InternalServerError>(500, 'Internal Server Error')
  @Post('/{itemId}')
  public async getItemDetail(@Path() itemId: number): Promise<Result<ItemDetailResDto>> {
    const result = await this.itemService.getItemDetail({ itemId });
    this.setStatus(result.statusCode);
    return result;
  }
}
