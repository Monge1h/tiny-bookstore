import { Controller, Post, Request, UseGuards, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import {
  ApiTags,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiUnauthorizedResponse,
  ApiBearerAuth,
  ApiConflictResponse,
} from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';
import { SignUpDto } from './dto/signup.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @ApiOperation({ summary: 'Log in with email and password' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 200, description: 'User successfully logged in.' })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials.' })
  @Post('login')
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @ApiBody({ type: SignUpDto })
  @ApiResponse({ status: 201, description: 'User successfully registered.' })
  @ApiResponse({ status: 400, description: 'Bad Request. Validation failed.' })
  @ApiConflictResponse({ description: 'User with this email already exists.' })
  @Post('signup')
  async signUp(@Body() signUpDto: SignUpDto) {
    return this.authService.signUp(signUpDto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Log out and invalidate the current session' })
  @ApiResponse({ status: 200, description: 'User successfully logged out.' })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized. Token is missing or invalid.',
  })
  @Post('signout')
  async signOut(@Request() req: Request) {
    const authorizationHeader = req.headers['authorization'] as string;
    const token = authorizationHeader.split(' ')[1];
    return this.authService.signOut(token);
  }
}
