import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength, IsEnum, IsOptional } from 'class-validator';
import { UserRole } from '../../../common/types';

export class RegisterDto {
    @ApiProperty({ example: 'John Doe', description: 'User full name' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ example: 'john@example.com', description: 'User email' })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty({ example: 'password123', description: 'User password (min 6 characters)' })
    @IsString()
    @MinLength(6)
    password: string;

    @ApiProperty({
        enum: UserRole,
        default: UserRole.USER,
        required: false,
        description: 'User role (only ADMIN can create other ADMIN users)'
    })
    @IsEnum(UserRole)
    @IsOptional()
    role?: UserRole;
}
