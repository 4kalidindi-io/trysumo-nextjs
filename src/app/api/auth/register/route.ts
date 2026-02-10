import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/models/User';
import { hashPassword, generateOTP, getOTPExpiry } from '@/lib/auth';
import { validateEmail, validatePassword, validateName, sanitizeInput } from '@/lib/validation';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { sendOTPEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';

    // Check rate limit
    const rateLimitResult = checkRateLimit(
      `register:${ip}`,
      RATE_LIMITS.register.limit,
      RATE_LIMITS.register.windowMs
    );

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many registration attempts. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { email, name, password } = body;

    // Validate inputs
    if (!email || !name || !password) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      );
    }

    const sanitizedEmail = sanitizeInput(email).toLowerCase();
    const sanitizedName = sanitizeInput(name);

    if (!validateEmail(sanitizedEmail)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    if (!validateName(sanitizedName)) {
      return NextResponse.json(
        { success: false, error: 'Name must be between 2 and 100 characters' },
        { status: 400 }
      );
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { success: false, error: passwordValidation.errors[0] },
        { status: 400 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Check if user already exists
    const existingUser = await User.findOne({ email: sanitizedEmail });
    if (existingUser) {
      // If user exists but not verified, allow re-registration
      if (!existingUser.emailVerified) {
        const otp = generateOTP();
        const passwordHash = await hashPassword(password);

        existingUser.name = sanitizedName;
        existingUser.passwordHash = passwordHash;
        existingUser.otp = otp;
        existingUser.otpExpiresAt = getOTPExpiry();
        existingUser.otpAttempts = 0;
        await existingUser.save();

        // Send OTP email
        await sendOTPEmail(sanitizedEmail, otp, sanitizedName);

        return NextResponse.json({
          success: true,
          message: 'Verification email sent. Please check your inbox.',
        });
      }

      return NextResponse.json(
        { success: false, error: 'An account with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Generate OTP
    const otp = generateOTP();

    // Create user
    const user = new User({
      email: sanitizedEmail,
      name: sanitizedName,
      passwordHash,
      otp,
      otpExpiresAt: getOTPExpiry(),
    });

    await user.save();

    // Send OTP email
    const emailSent = await sendOTPEmail(sanitizedEmail, otp, sanitizedName);

    if (!emailSent) {
      console.error('Failed to send OTP email to:', sanitizedEmail);
      // Still return success - user can request resend
    }

    return NextResponse.json({
      success: true,
      message: 'Account created! Please check your email for the verification code.',
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create account. Please try again.' },
      { status: 500 }
    );
  }
}
