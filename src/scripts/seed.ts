import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UsersService } from '../modules/users/users.service';
import { UserRole } from '../common/types';

async function seed() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const usersService = app.get(UsersService);

    console.log('🌱 Seeding database...');

    // Create admin user
    try {
        const admin = await usersService.create(
            'Admin',
            'admin@beauty.com',
            'admin123',
            UserRole.ADMIN,
        );
        console.log(`✅ Admin created: ${admin.email}`);
    } catch (error) {
        if ((error as { status?: number }).status === 409) {
            console.log('ℹ️ Admin already exists');
        } else {
            console.error('❌ Error creating admin:', (error as Error).message);
        }
    }

    // Create test user
    try {
        const user = await usersService.create(
            'Test User',
            'user@beauty.com',
            'user123',
            UserRole.USER,
        );
        console.log(`✅ User created: ${user.email}`);
    } catch (error) {
        if ((error as { status?: number }).status === 409) {
            console.log('ℹ️ User already exists');
        } else {
            console.error('❌ Error creating user:', (error as Error).message);
        }
    }

    console.log('🌱 Seed completed!');
    console.log('\n📋 Credentials:');
    console.log('   Admin: admin@beauty.com / admin123');
    console.log('   User:  user@beauty.com / user123');

    await app.close();
}

seed();
