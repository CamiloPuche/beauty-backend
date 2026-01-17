import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { RegisterDto, LoginDto } from './dto';
import { JwtPayload, UserRole } from '../../common/types';
import { UserDocument } from '../users/schemas/user.schema';

export interface AuthResponse {
    user: {
        id: string;
        name: string;
        email: string;
        role: UserRole;
    };
    accessToken: string;
}

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
    ) { }

    async register(dto: RegisterDto, currentUserRole?: UserRole): Promise<AuthResponse> {
        // Only ADMIN can create other ADMIN users
        if (dto.role === UserRole.ADMIN && currentUserRole !== UserRole.ADMIN) {
            throw new ForbiddenException('Only administrators can create admin users');
        }

        const user = await this.usersService.create(
            dto.name,
            dto.email,
            dto.password,
            dto.role || UserRole.USER,
        );

        return this.generateAuthResponse(user);
    }

    async login(dto: LoginDto): Promise<AuthResponse> {
        const user = await this.usersService.findByEmail(dto.email);

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        if (!user.isActive) {
            throw new UnauthorizedException('Account is deactivated');
        }

        const isPasswordValid = await this.usersService.validatePassword(user, dto.password);

        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        return this.generateAuthResponse(user);
    }

    async getProfile(userId: string): Promise<UserDocument> {
        return this.usersService.findByIdOrFail(userId);
    }

    private generateAuthResponse(user: UserDocument): AuthResponse {
        const payload: JwtPayload = {
            sub: user._id.toString(),
            email: user.email,
            role: user.role,
        };

        return {
            user: {
                id: user._id.toString(),
                name: user.name,
                email: user.email,
                role: user.role,
            },
            accessToken: this.jwtService.sign(payload),
        };
    }
}
