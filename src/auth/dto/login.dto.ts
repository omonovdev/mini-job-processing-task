import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'eshmat@mail.ru' })
  @IsEmail({}, { message: 'Email format is invalid' })
  email: string;

  @ApiProperty({ example: 'qwerty1' })
  @IsNotEmpty({ message: 'Password is required' })
  password: string;
}
