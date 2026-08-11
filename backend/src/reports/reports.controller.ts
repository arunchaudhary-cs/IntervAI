import {
Controller,
Post,
Param,
UseGuards
} from '@nestjs/common';

import { ReportsService } from './reports.service';


@Controller('reports')
export class ReportsController {


constructor(
private reportsService:ReportsService
){}



@Post(':id')
async createReport(
@Param('id') id:string
){

return this.reportsService
.generateReport(id);

}


}