import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/models/User';
import {
  verifyPassword,
  generateJWT,
  setSessionCookie,
  isAccountLocked,
  getLockoutTime,
} from '@/lib/auth';
import { verifyTurnstileToken } from '@/lib/turnstile';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

const MAX_LOGIN_ATTEMPTS = 5;

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';

    // Check rate limit
    const rateLimitResult = checkRateLimit(
      `login:${ip}`,
      RATE_LIMITS.login.limit,
      RATE_LIMITS.login.windowMs
    );

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many login attempts. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { email, password, turnstileToken } = body;

    // Validate Turnstile token
    const turnstileValid = await verifyTurnstileToken(turnstileToken, ip);
    if (!turnstileValid) {
      return NextResponse.json(
        { success: false, error: 'CAPTCHA verification failed. Please try again.' },
        { status: 400 }
      );
    }

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Find user with password hash
    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if account is locked
    if (isAccountLocked(user.lockedUntil)) {
      const minutesLeft = Math.ceil(
        (new Date(user.lockedUntil!).getTime() - Date.now()) / 60000
      );
      return NextResponse.json(
        {
          success: false,
          error: `Account is locked. Please try again in ${minutesLeft} minute${minutesLeft > 1 ? 's' : ''}.`,
        },
        { status: 423 }
      );
    }

    // Verify password
    const passwordValid = await verifyPassword(password, user.passwordHash);

    if (!passwordValid) {
      // Increment login attempts
      user.loginAttempts += 1;

      // Lock account if too many attempts
      if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
        user.lockedUntil = getLockoutTime();
        await user.save();
        return NextResponse.json(
          {
            success: false,
            error: 'Too many failed attempts. Account locked for 15 minutes.',
          },
          { status: 423 }
        );
      }

      await user.save();

      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if email is verified
    if (!user.emailVerified) {
      return NextResponse.json(
        {
          success: false,
          error: 'Please verify your email before logging in.',
          needsVerification: true,
        },
        { status: 403 }
      );
    }

    // Reset login attempts on success
    user.loginAttempts = 0;
    user.lockedUntil = null;
    user.lastLoginAt = new Date();
    await user.save();

    // Generate JWT
    const token = generateJWT(user._id.toString(), user.email);

    // Create response with session cookie
    const response = NextResponse.json({
      success: true,
      message: 'Login successful!',
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified,
      },
    });

    setSessionCookie(response, token);

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Login failed. Please try again.' },
      { status: 500 }
    );
  }
}
