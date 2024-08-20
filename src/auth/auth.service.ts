import { Injectable, UnauthorizedException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { addHours } from 'date-fns';

@Injectable()
export class AuthService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.databaseService.user.findUnique({
      where: { email },
    });

    if (user && (await bcrypt.compare(password, user.password))) {
      const result = user;
      delete result.password;
      return result;
    }
    throw new UnauthorizedException('Invalid credentials');
  }

  async login(user: { email: string; id: string; role: string }) {
    const payload = { email: user.email, sub: user.id, role: user.role };

    const accessToken = this.jwtService.sign(payload);

    const sessionId = uuidv4();
    await this.databaseService.session.create({
      data: {
        id: sessionId,
        userId: user.id,
        token: accessToken,
        expiresAt: addHours(new Date(), 1),
      },
    });

    const refreshToken = uuidv4();
    await this.databaseService.refreshToken.create({
      data: {
        id: uuidv4(),
        userId: user.id,
        token: refreshToken,
        expiresAt: addHours(new Date(), 24),
      },
    });

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }
}
