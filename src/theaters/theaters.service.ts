import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm'; // Equivalente a JPA
import { CreateTheaterDto } from './dto/create-theater.dto';
import { TheaterResponseDto } from './dto/theater-response.dto';
import { UpdateTheaterDto } from './dto/update-theater.dto';
import { TheaterMapper } from './mappers/theater.mapper';
import { TheatersRepository } from './repositories/theaters.repository';
import { Theater } from './entities/theater.entity';

@Injectable()
export class TheatersService {
  constructor(
    @InjectRepository(Theater) //
    private readonly theatersRepository: Repository<Theater>, // En estas dos lineas tengo la conexión a la base de datos donde puedo hacer consultas basicas tipo CRUD
    private readonly customTheatersRepository: TheatersRepository,
    private readonly theaterMapper: TheaterMapper,
  ) {}
  // Si quiero hacer reportes (consultas) personalizadas debo crear otro repository para esas consultas, en el serice es para las operaciones basicas de CRUD

  async create(dto: CreateTheaterDto): Promise<TheaterResponseDto> {
    const entity = this.theaterMapper.toEntity(dto);
    const saved = await this.theatersRepository.save(entity); // El await lo que hace es que espera para responderle al usuario SOLO cuando la petición se resuelva en la base de datos, se usa para ahorrar tiempo de computo
    return this.theaterMapper.toResponseDto(saved);
  }

  async findAll(): Promise<TheaterResponseDto[]> {
    const theaters = await this.theatersRepository.find({
      relations: { projector: true },
    });
    return this.theaterMapper.toResponseDtoList(theaters);
  }

  async findOne(id: number): Promise<TheaterResponseDto> {
    const theater = await this.theatersRepository.findOne({
      where: { id },
      relations: { projector: true },
    });
    if (!theater) {
      throw new NotFoundException(`Theater with id ${id} not found`);
    }
    return this.theaterMapper.toResponseDto(theater);
  }

  async update(id: number, dto: UpdateTheaterDto): Promise<TheaterResponseDto> {
    const theater = await this.theatersRepository.findOne({
      where: { id },
      relations: { projector: true },
    });
    if (!theater) {
      throw new NotFoundException(`Theater with id ${id} not found`);
    }

    const merged = this.theaterMapper.mergeEntity(theater, dto);
    const saved = await this.theatersRepository.save(merged);
    return this.theaterMapper.toResponseDto(saved);
  }

  async remove(id: number): Promise<{ message: string }> {
    const theater = await this.theatersRepository.findOne({ where: { id } });
    if (!theater) {
      throw new NotFoundException(`Theater with id ${id} not found`);
    }

    await this.theatersRepository.remove(theater);
    return { message: `Theater #${id} deleted successfully` };
  }

  async getLargeTheatersReport(minCapacity: number): Promise<TheaterResponseDto[]> {
    const rows = await this.customTheatersRepository.findLargeTheatersReport(minCapacity);
    return this.theaterMapper.toResponseDtoList(rows);
  }
}
