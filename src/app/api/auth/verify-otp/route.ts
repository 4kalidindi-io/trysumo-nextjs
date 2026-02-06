import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/models/User';
import { generateJWT, setSessionCookie, isOTPExpired } from '@/lib/auth';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { sendWelcomeEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, otp } = body;

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, error: 'Email and verification code are required' },
        { status: 400 }
      );
    }

    // Check rate limit by email
    const rateLimitResult = checkRateLimit(
      `verify-otp:${email}`,
      RATE_LIMITS.verifyOtp.limit,
      RATE_LIMITS.verifyOtp.windowMs
    );

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many verification attempts. Please try again later.' },
        { status: 429 }
      );
    }

    await connectToDatabase();

    // Find user with OTP field
    const user = await User.findOne({ email: email.toLowerCase() }).select('+otp');

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No account found with this email' },
        { status: 400 }
      );
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { success: false, error: 'Email is already verified. Please login.' },
        { status: 400 }
      );
    }

    // Check OTP expiry
    if (isOTPExpired(user.otpExpiresAt)) {
      return NextResponse.json(
        { success: false, error: 'Verification code has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // Check OTP attempts
    if (user.otpAttempts >= 5) {
      return NextResponse.json(
        { success: false, error: 'Too many failed attempts. Please request a new code.' },
        { status: 400 }
      );
    }

    // Verify OTP
    if (user.otp !== otp) {
      user.otpAttempts += 1;
      await user.save();

      return NextResponse.json(
        { success: false, error: 'Invalid verification code' },
        { status: 400 }
      );
    }

    // Mark email as verified
    user.emailVerified = true;
    user.emailVerifiedAt = new Date();
    user.otp = null;
    user.otpExpiresAt = null;
    user.otpAttempts = 0;
    await user.save();

    // Generate JWT
    const token = generateJWT(user._id.toString(), user.email);

    // Create response with session cookie
    const response = NextResponse.json({
      success: true,
      message: 'Email verified successfully!',
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        emailVerified: true,
      },
    });

    setSessionCookie(response, token);

    // Send welcome email (non-blocking)
    sendWelcomeEmail(user.email, user.name).catch(console.error);

    return response;
  } catch (error) {
    console.error('OTP verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Verification failed. Please try again.' },
      { status: 500 }
    );
  }
}
