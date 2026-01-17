import { Request } from 'express';

export enum UserRole {
    USER = 'USER',
    ADMIN = 'ADMIN',
}

export interface JwtPayload {
    sub: string;
    email: string;
    role: UserRole;
}

export interface AuthenticatedRequest extends Request {
    user: {
        userId: string;
        email: string;
        role: UserRole;
    };
}

export interface RequestWithCorrelationId extends Request {
    correlationId?: string;
}
