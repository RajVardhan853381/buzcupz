import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';

describe('AuthController (e2e)', () => {
    let app: INestApplication;
    let prisma: PrismaService;
    let restaurantId: string;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        
        // Apply same pipes as production
        app.useGlobalPipes(
            new ValidationPipe({
                whitelist: true,
                forbidNonWhitelisted: true,
                transform: true,
            })
        );

        await app.init();

        prisma = app.get<PrismaService>(PrismaService);

        // Get test restaurant ID
        const restaurant = await prisma.restaurant.findFirst({
            where: { slug: 'test-restaurant' },
        });
        restaurantId = restaurant!.id;
    });

    afterAll(async () => {
        await app.close();
    });

    describe('/api/v1/auth/register (POST)', () => {
        const registerDto = {
            email: 'e2e-test@example.com',
            password: 'SecurePass123!',
            firstName: 'E2E',
            lastName: 'Test',
            phone: '+1234567890',
            role: 'STAFF',
            restaurantId: '',
        };

        beforeEach(() => {
            registerDto.restaurantId = restaurantId;
        });

        afterEach(async () => {
            // Clean up created user
            await prisma.user.deleteMany({
                where: { email: registerDto.email },
            });
        });

        it('should register a new user successfully', () => {
            return request(app.getHttpServer())
                .post('/api/v1/auth/register')
                .send(registerDto)
                .expect(201)
                .expect((res) => {
                    expect(res.body).toHaveProperty('user');
                    expect(res.body).toHaveProperty('tokens');
                    expect(res.body.user.email).toBe(registerDto.email.toLowerCase());
                    expect(res.body.user).not.toHaveProperty('passwordHash');
                    expect(res.body.tokens).toHaveProperty('accessToken');
                    expect(res.body.tokens).toHaveProperty('refreshToken');
                });
        });

        it('should return 409 if user already exists', async () => {
            // Create user first
            await request(app.getHttpServer())
                .post('/api/v1/auth/register')
                .send(registerDto)
                .expect(201);

            // Try to register again
            return request(app.getHttpServer())
                .post('/api/v1/auth/register')
                .send(registerDto)
                .expect(409)
                .expect((res) => {
                    expect(res.body.message).toContain('already exists');
                });
        });

        it('should return 400 with invalid email', () => {
            return request(app.getHttpServer())
                .post('/api/v1/auth/register')
                .send({ ...registerDto, email: 'invalid-email' })
                .expect(400);
        });

        it('should return 400 with weak password', () => {
            return request(app.getHttpServer())
                .post('/api/v1/auth/register')
                .send({ ...registerDto, password: '123' })
                .expect(400);
        });

        it('should return 404 with invalid restaurant ID', () => {
            return request(app.getHttpServer())
                .post('/api/v1/auth/register')
                .send({ ...registerDto, restaurantId: 'non-existent-id' })
                .expect(404);
        });
    });

    describe('/api/v1/auth/login (POST)', () => {
        const testUser = {
            email: 'login-test@example.com',
            password: 'SecurePass123!',
            firstName: 'Login',
            lastName: 'Test',
            phone: '+1234567890',
            role: 'STAFF',
        };

        let accessToken: string;
        let refreshToken: string;

        beforeAll(async () => {
            // Create test user
            const res = await request(app.getHttpServer())
                .post('/api/v1/auth/register')
                .send({ ...testUser, restaurantId });

            accessToken = res.body.tokens.accessToken;
            refreshToken = res.body.tokens.refreshToken;
        });

        afterAll(async () => {
            // Clean up
            await prisma.user.deleteMany({
                where: { email: testUser.email },
            });
        });

        it('should login successfully with valid credentials', () => {
            return request(app.getHttpServer())
                .post('/api/v1/auth/login')
                .send({
                    email: testUser.email,
                    password: testUser.password,
                })
                .expect(200)
                .expect((res) => {
                    expect(res.body).toHaveProperty('user');
                    expect(res.body).toHaveProperty('tokens');
                    expect(res.body.user.email).toBe(testUser.email.toLowerCase());
                });
        });

        it('should return 401 with invalid email', () => {
            return request(app.getHttpServer())
                .post('/api/v1/auth/login')
                .send({
                    email: 'wrong@example.com',
                    password: testUser.password,
                })
                .expect(401);
        });

        it('should return 401 with invalid password', () => {
            return request(app.getHttpServer())
                .post('/api/v1/auth/login')
                .send({
                    email: testUser.email,
                    password: 'WrongPassword123!',
                })
                .expect(401);
        });
    });

    describe('/api/v1/auth/refresh (POST)', () => {
        let validRefreshToken: string;

        beforeAll(async () => {
            const res = await request(app.getHttpServer())
                .post('/api/v1/auth/register')
                .send({
                    email: 'refresh-test@example.com',
                    password: 'SecurePass123!',
                    firstName: 'Refresh',
                    lastName: 'Test',
                    role: 'STAFF',
                    restaurantId,
                });

            validRefreshToken = res.body.tokens.refreshToken;
        });

        afterAll(async () => {
            await prisma.user.deleteMany({
                where: { email: 'refresh-test@example.com' },
            });
        });

        it('should refresh tokens successfully', () => {
            return request(app.getHttpServer())
                .post('/api/v1/auth/refresh')
                .send({ refreshToken: validRefreshToken })
                .expect(200)
                .expect((res) => {
                    expect(res.body).toHaveProperty('accessToken');
                    expect(res.body).toHaveProperty('refreshToken');
                });
        });

        it('should return 401 with invalid refresh token', () => {
            return request(app.getHttpServer())
                .post('/api/v1/auth/refresh')
                .send({ refreshToken: 'invalid-token' })
                .expect(401);
        });
    });

    describe('/api/v1/auth/profile (GET)', () => {
        let accessToken: string;

        beforeAll(async () => {
            const res = await request(app.getHttpServer())
                .post('/api/v1/auth/register')
                .send({
                    email: 'profile-test@example.com',
                    password: 'SecurePass123!',
                    firstName: 'Profile',
                    lastName: 'Test',
                    role: 'STAFF',
                    restaurantId,
                });

            accessToken = res.body.tokens.accessToken;
        });

        afterAll(async () => {
            await prisma.user.deleteMany({
                where: { email: 'profile-test@example.com' },
            });
        });

        it('should get profile with valid token', () => {
            return request(app.getHttpServer())
                .get('/api/v1/auth/profile')
                .set('Authorization', `Bearer ${accessToken}`)
                .expect(200)
                .expect((res) => {
                    expect(res.body.email).toBe('profile-test@example.com');
                    expect(res.body).not.toHaveProperty('passwordHash');
                });
        });

        it('should return 401 without token', () => {
            return request(app.getHttpServer())
                .get('/api/v1/auth/profile')
                .expect(401);
        });

        it('should return 401 with invalid token', () => {
            return request(app.getHttpServer())
                .get('/api/v1/auth/profile')
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);
        });
    });
});
