import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
    ConflictException,
    UnauthorizedException,
    NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../../database/prisma.service';
import { RegisterDto, LoginDto } from './dto';
import { UserRole } from '@prisma/client';

// Mock bcrypt
jest.mock('bcrypt', () => ({
    hash: jest.fn(),
    compare: jest.fn(),
}));

describe('AuthService', () => {
    let service: AuthService;
    let prismaService: PrismaService;
    let jwtService: JwtService;

    // Mock functions
    const mockUserFindUnique = jest.fn();
    const mockUserCreate = jest.fn();
    const mockUserUpdate = jest.fn();
    const mockRestaurantFindUnique = jest.fn();
    const mockSessionFindUnique = jest.fn();
    const mockSessionCreate = jest.fn();
    const mockSessionUpdate = jest.fn();
    const mockSessionDelete = jest.fn();
    const mockSessionDeleteMany = jest.fn();
    const mockJwtSignAsync = jest.fn();
    const mockJwtVerify = jest.fn();

    // Test data
    const mockRestaurant = {
        id: 'restaurant-1',
        name: 'Test Restaurant',
        isActive: true,
    };

    const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        passwordHash: 'hashed-password',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890',
        role: UserRole.STAFF,
        isActive: true,
        isEmailVerified: false,
        restaurantId: 'restaurant-1',
        lastLoginAt: null,
        lastLoginIp: null,
        avatar: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        restaurant: mockRestaurant,
    };

    const mockTokens = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
    };

    const mockSession = {
        id: 'session-1',
        userId: 'user-1',
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        userAgent: null,
        ipAddress: null,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        lastActivityAt: new Date(),
        createdAt: new Date(),
        user: mockUser,
    };

    beforeEach(async () => {
        // Reset all mocks
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                {
                    provide: PrismaService,
                    useValue: {
                        user: {
                            findUnique: mockUserFindUnique,
                            create: mockUserCreate,
                            update: mockUserUpdate,
                        },
                        restaurant: {
                            findUnique: mockRestaurantFindUnique,
                        },
                        session: {
                            findUnique: mockSessionFindUnique,
                            create: mockSessionCreate,
                            update: mockSessionUpdate,
                            delete: mockSessionDelete,
                            deleteMany: mockSessionDeleteMany,
                        },
                    },
                },
                {
                    provide: JwtService,
                    useValue: {
                        signAsync: mockJwtSignAsync,
                        verify: mockJwtVerify,
                    },
                },
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn((key: string) => {
                            const config: Record<string, string> = {
                                'jwt.secret': 'test-secret',
                                'jwt.refreshSecret': 'test-refresh-secret',
                                'jwt.accessExpiresIn': '15m',
                                'jwt.refreshExpiresIn': '7d',
                            };
                            return config[key];
                        }),
                    },
                },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
        prismaService = module.get<PrismaService>(PrismaService);
        jwtService = module.get<JwtService>(JwtService);
    });

    describe('register', () => {
        const registerDto: RegisterDto = {
            email: 'newuser@example.com',
            password: 'SecurePassword123!',
            firstName: 'Jane',
            lastName: 'Smith',
            phone: '+1987654321',
            restaurantId: 'restaurant-1',
            role: UserRole.STAFF,
        };

        it('should successfully register a new user', async () => {
            // Arrange
            const newUser = {
                ...mockUser,
                id: 'new-user-id',
                email: registerDto.email.toLowerCase(),
                firstName: registerDto.firstName,
                lastName: registerDto.lastName,
            };

            mockUserFindUnique.mockResolvedValue(null);
            mockRestaurantFindUnique.mockResolvedValue(mockRestaurant);
            (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
            mockUserCreate.mockResolvedValue(newUser);
            mockJwtSignAsync
                .mockResolvedValueOnce(mockTokens.accessToken)
                .mockResolvedValueOnce(mockTokens.refreshToken);
            mockSessionDeleteMany.mockResolvedValue({ count: 0 });
            mockSessionCreate.mockResolvedValue(mockSession);

            // Act
            const result = await service.register(registerDto);

            // Assert
            expect(result.user).toBeDefined();
            expect(result.user.email).toBe(registerDto.email.toLowerCase());
            expect(result.tokens.accessToken).toBe(mockTokens.accessToken);
            expect(result.tokens.refreshToken).toBe(mockTokens.refreshToken);
            expect(result.user).not.toHaveProperty('passwordHash');

            expect(mockUserFindUnique).toHaveBeenCalledWith({
                where: { email: registerDto.email },
            });
            expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
        });

        it('should throw ConflictException if email already exists', async () => {
            // Arrange
            mockUserFindUnique.mockResolvedValue(mockUser);

            // Act & Assert
            await expect(service.register(registerDto)).rejects.toThrow(
                ConflictException,
            );
            await expect(service.register(registerDto)).rejects.toThrow(
                'User with this email already exists',
            );
        });

        it('should throw NotFoundException if restaurant does not exist', async () => {
            // Arrange
            mockUserFindUnique.mockResolvedValue(null);
            mockRestaurantFindUnique.mockResolvedValue(null);

            // Act & Assert
            await expect(service.register(registerDto)).rejects.toThrow(
                NotFoundException,
            );
            await expect(service.register(registerDto)).rejects.toThrow(
                'Restaurant not found',
            );
        });

        it('should hash the password before storing', async () => {
            // Arrange
            mockUserFindUnique.mockResolvedValue(null);
            mockRestaurantFindUnique.mockResolvedValue(mockRestaurant);
            (bcrypt.hash as jest.Mock).mockResolvedValue('securely-hashed');
            mockUserCreate.mockResolvedValue({
                ...mockUser,
                passwordHash: 'securely-hashed',
            });
            mockJwtSignAsync.mockResolvedValue('token');
            mockSessionDeleteMany.mockResolvedValue({ count: 0 });
            mockSessionCreate.mockResolvedValue(mockSession);

            // Act
            await service.register(registerDto);

            // Assert
            expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
            expect(mockUserCreate).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    passwordHash: 'securely-hashed',
                }),
            });
        });

        it('should convert email to lowercase', async () => {
            // Arrange
            const dtoWithUpperCase = {
                ...registerDto,
                email: 'TEST@EXAMPLE.COM',
            };

            mockUserFindUnique.mockResolvedValue(null);
            mockRestaurantFindUnique.mockResolvedValue(mockRestaurant);
            (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
            mockUserCreate.mockResolvedValue(mockUser);
            mockJwtSignAsync.mockResolvedValue('token');
            mockSessionDeleteMany.mockResolvedValue({ count: 0 });
            mockSessionCreate.mockResolvedValue(mockSession);

            // Act
            await service.register(dtoWithUpperCase);

            // Assert
            expect(mockUserCreate).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    email: 'test@example.com',
                }),
            });
        });
    });

    describe('login', () => {
        const loginDto: LoginDto = {
            email: 'test@example.com',
            password: 'SecurePassword123!',
        };

        it('should successfully login with valid credentials', async () => {
            // Arrange
            mockUserFindUnique.mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            mockJwtSignAsync
                .mockResolvedValueOnce(mockTokens.accessToken)
                .mockResolvedValueOnce(mockTokens.refreshToken);
            mockSessionDeleteMany.mockResolvedValue({ count: 0 });
            mockSessionCreate.mockResolvedValue(mockSession);
            mockUserUpdate.mockResolvedValue(mockUser);

            // Act
            const result = await service.login(loginDto);

            // Assert
            expect(result.user).toBeDefined();
            expect(result.tokens.accessToken).toBe(mockTokens.accessToken);
            expect(result.tokens.refreshToken).toBe(mockTokens.refreshToken);
            expect(result.user).not.toHaveProperty('passwordHash');
        });

        it('should throw UnauthorizedException for invalid email', async () => {
            // Arrange
            mockUserFindUnique.mockResolvedValue(null);

            // Act & Assert
            await expect(service.login(loginDto)).rejects.toThrow(
                UnauthorizedException,
            );
            await expect(service.login(loginDto)).rejects.toThrow(
                'Invalid credentials',
            );
        });

        it('should throw UnauthorizedException for invalid password', async () => {
            // Arrange
            mockUserFindUnique.mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(false);

            // Act & Assert
            await expect(service.login(loginDto)).rejects.toThrow(
                UnauthorizedException,
            );
            await expect(service.login(loginDto)).rejects.toThrow(
                'Invalid credentials',
            );
        });

        it('should throw UnauthorizedException for deactivated user', async () => {
            // Arrange
            const inactiveUser = { ...mockUser, isActive: false };
            mockUserFindUnique.mockResolvedValue(inactiveUser);

            // Act & Assert
            await expect(service.login(loginDto)).rejects.toThrow(
                UnauthorizedException,
            );
            await expect(service.login(loginDto)).rejects.toThrow(
                'Account is deactivated',
            );
        });

        it('should throw UnauthorizedException for deactivated restaurant', async () => {
            // Arrange
            const userWithInactiveRestaurant = {
                ...mockUser,
                restaurant: { ...mockRestaurant, isActive: false },
            };
            mockUserFindUnique.mockResolvedValue(userWithInactiveRestaurant);

            // Act & Assert
            await expect(service.login(loginDto)).rejects.toThrow(
                UnauthorizedException,
            );
            await expect(service.login(loginDto)).rejects.toThrow(
                'Restaurant is deactivated',
            );
        });

        it('should update lastLoginAt on successful login', async () => {
            // Arrange
            mockUserFindUnique.mockResolvedValue(mockUser);
            (bcrypt.compare as jest.Mock).mockResolvedValue(true);
            mockJwtSignAsync.mockResolvedValue('token');
            mockSessionDeleteMany.mockResolvedValue({ count: 0 });
            mockSessionCreate.mockResolvedValue(mockSession);
            mockUserUpdate.mockResolvedValue(mockUser);

            // Act
            await service.login(loginDto);

            // Assert
            expect(mockUserUpdate).toHaveBeenCalledWith({
                where: { id: mockUser.id },
                data: { lastLoginAt: expect.any(Date) },
            });
        });

        it('should convert email to lowercase when searching', async () => {
            // Arrange
            const dtoWithUpperCase = { ...loginDto, email: 'TEST@EXAMPLE.COM' };
            mockUserFindUnique.mockResolvedValue(null);

            // Act
            try {
                await service.login(dtoWithUpperCase);
            } catch {
                // Expected to throw
            }

            // Assert
            expect(mockUserFindUnique).toHaveBeenCalledWith({
                where: { email: 'test@example.com' },
                include: expect.any(Object),
            });
        });
    });

    describe('validateUser', () => {
        it('should return user if active and restaurant is active', async () => {
            // Arrange
            mockUserFindUnique.mockResolvedValue(mockUser);

            // Act
            const result = await service.validateUser('user-1');

            // Assert
            expect(result).toBeDefined();
            expect(result?.id).toBe('user-1');
        });

        it('should return null if user not found', async () => {
            // Arrange
            mockUserFindUnique.mockResolvedValue(null);

            // Act
            const result = await service.validateUser('nonexistent');

            // Assert
            expect(result).toBeNull();
        });

        it('should return null if user is inactive', async () => {
            // Arrange
            const inactiveUser = { ...mockUser, isActive: false };
            mockUserFindUnique.mockResolvedValue(inactiveUser);

            // Act
            const result = await service.validateUser('user-1');

            // Assert
            expect(result).toBeNull();
        });

        it('should return null if restaurant is inactive', async () => {
            // Arrange
            const userWithInactiveRestaurant = {
                ...mockUser,
                restaurant: { ...mockRestaurant, isActive: false },
            };
            mockUserFindUnique.mockResolvedValue(userWithInactiveRestaurant);

            // Act
            const result = await service.validateUser('user-1');

            // Assert
            expect(result).toBeNull();
        });
    });

    describe('refreshTokens', () => {
        it('should return new tokens for valid refresh token', async () => {
            // Arrange
            mockJwtVerify.mockReturnValue({ sub: 'user-1' });
            mockSessionFindUnique.mockResolvedValue(mockSession);
            mockJwtSignAsync
                .mockResolvedValueOnce('new-access-token')
                .mockResolvedValueOnce('new-refresh-token');
            mockSessionUpdate.mockResolvedValue({
                ...mockSession,
                accessToken: 'new-access-token',
                refreshToken: 'new-refresh-token',
            });

            // Act
            const result = await service.refreshTokens('mock-refresh-token');

            // Assert
            expect(result.accessToken).toBe('new-access-token');
            expect(result.refreshToken).toBe('new-refresh-token');
        });

        it('should throw UnauthorizedException for invalid refresh token', async () => {
            // Arrange
            mockJwtVerify.mockImplementation(() => {
                throw new Error('Invalid token');
            });

            // Act & Assert
            await expect(
                service.refreshTokens('invalid-token'),
            ).rejects.toThrow(UnauthorizedException);
        });

        it('should throw UnauthorizedException if session not found', async () => {
            // Arrange
            mockJwtVerify.mockReturnValue({ sub: 'user-1' });
            mockSessionFindUnique.mockResolvedValue(null);

            // Act & Assert
            await expect(
                service.refreshTokens('valid-but-no-session'),
            ).rejects.toThrow(UnauthorizedException);
        });

        it('should throw UnauthorizedException if session userId does not match', async () => {
            // Arrange
            mockJwtVerify.mockReturnValue({ sub: 'different-user' });
            mockSessionFindUnique.mockResolvedValue(mockSession);

            // Act & Assert
            await expect(
                service.refreshTokens('mock-refresh-token'),
            ).rejects.toThrow(UnauthorizedException);
        });

        it('should delete session and throw if expired', async () => {
            // Arrange
            const expiredSession = {
                ...mockSession,
                expiresAt: new Date(Date.now() - 1000), // Expired
            };
            mockJwtVerify.mockReturnValue({ sub: 'user-1' });
            mockSessionFindUnique.mockResolvedValue(expiredSession);
            mockSessionDelete.mockResolvedValue(expiredSession);

            // Act & Assert
            await expect(
                service.refreshTokens('mock-refresh-token'),
            ).rejects.toThrow(UnauthorizedException);
            expect(mockSessionDelete).toHaveBeenCalledWith({
                where: { id: mockSession.id },
            });
        });
    });

    describe('logout', () => {
        it('should delete session by access token', async () => {
            // Arrange
            mockSessionDeleteMany.mockResolvedValue({ count: 1 });

            // Act
            await service.logout('mock-access-token');

            // Assert
            expect(mockSessionDeleteMany).toHaveBeenCalledWith({
                where: { accessToken: 'mock-access-token' },
            });
        });

        it('should not throw if session does not exist', async () => {
            // Arrange
            mockSessionDeleteMany.mockResolvedValue({ count: 0 });

            // Act & Assert
            await expect(
                service.logout('nonexistent-token'),
            ).resolves.not.toThrow();
        });
    });

    describe('getProfile', () => {
        it('should return user profile without password', async () => {
            // Arrange
            mockUserFindUnique.mockResolvedValue(mockUser);

            // Act
            const result = await service.getProfile('user-1');

            // Assert
            expect(result).toBeDefined();
            expect(result.email).toBe(mockUser.email);
            expect(result).not.toHaveProperty('passwordHash');
        });

        it('should throw NotFoundException if user not found', async () => {
            // Arrange
            mockUserFindUnique.mockResolvedValue(null);

            // Act & Assert
            await expect(service.getProfile('nonexistent')).rejects.toThrow(
                NotFoundException,
            );
            await expect(service.getProfile('nonexistent')).rejects.toThrow(
                'User not found',
            );
        });
    });

    describe('Token Generation', () => {
        it('should generate access and refresh tokens with correct payload', async () => {
            // Arrange
            mockUserFindUnique.mockResolvedValue(null);
            mockRestaurantFindUnique.mockResolvedValue(mockRestaurant);
            (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
            mockUserCreate.mockResolvedValue(mockUser);
            mockJwtSignAsync.mockResolvedValue('token');
            mockSessionDeleteMany.mockResolvedValue({ count: 0 });
            mockSessionCreate.mockResolvedValue(mockSession);

            // Act
            await service.register({
                email: 'test@example.com',
                password: 'password123',
                firstName: 'Test',
                lastName: 'User',
                restaurantId: 'restaurant-1',
            });

            // Assert
            expect(mockJwtSignAsync).toHaveBeenCalledWith(
                expect.objectContaining({
                    sub: mockUser.id,
                    email: mockUser.email,
                    role: mockUser.role,
                    restaurantId: mockUser.restaurantId,
                }),
                expect.objectContaining({
                    secret: 'test-secret',
                    expiresIn: '15m',
                }),
            );
        });
    });
});
