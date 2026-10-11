import { Body, Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import { ActivationsService } from './activations.service.js';
import { CreateActivationDto } from './create-activation.dto.js';

@Controller('activations')
export class ActivationsController {
  constructor(private readonly service: ActivationsService) {}

  // RF-02: 202 Accepted con activationId y estado PENDING
  @Post()
  @HttpCode(202)
  create(@Body() dto: CreateActivationDto) {
    return this.service.create(dto);
  }

  // RF-09: estado actual e historial
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}