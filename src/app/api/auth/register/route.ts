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
        const emailSentForResend = await sendOTPEmail(sanitizedEmail, otp, sanitizedName);
        const isDevelopmentMode = !process.env.RESEND_API_KEY;

        return NextResponse.json({
          success: true,
          message: emailSentForResend
            ? 'Verification email sent. Please check your inbox.'
            : 'Verification email prepared. Check server logs for your code.',
          ...(isDevelopmentMode && { otp, devMode: true, note: 'OTP included because RESEND_API_KEY is not configured' }),
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
    }

    // Include OTP in response for development/testing when email is not configured
    const isDevelopment = !process.env.RESEND_API_KEY;

    return NextResponse.json({
      success: true,
      message: emailSent
        ? 'Account created! Please check your email for the verification code.'
        : 'Account created! Check server logs for your verification code.',
      ...(isDevelopment && { otp, devMode: true, note: 'OTP included because RESEND_API_KEY is not configured' }),
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create account. Please try again.' },
      { status: 500 }
    );
  }
}
