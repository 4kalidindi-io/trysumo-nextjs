import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/models/User';
import { generateOTP, getOTPExpiry } from '@/lib/auth';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { sendOTPEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check rate limit by email (stricter)
    const rateLimitResult = checkRateLimit(
      `resend-otp:${email}`,
      RATE_LIMITS.resendOtp.limit,
      RATE_LIMITS.resendOtp.windowMs
    );

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many resend attempts. Please wait before trying again.' },
        { status: 429 }
      );
    }

    await connectToDatabase();

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Don't reveal if email exists or not
      return NextResponse.json({
        success: true,
        message: 'If an account exists, a new verification code has been sent.',
      });
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { success: false, error: 'Email is already verified. Please login.' },
        { status: 400 }
      );
    }

    // Generate new OTP
    const otp = generateOTP();
    user.otp = otp;
    user.otpExpiresAt = getOTPExpiry();
    user.otpAttempts = 0;
    await user.save();

    // Send OTP email
    await sendOTPEmail(user.email, otp, user.name);

    return NextResponse.json({
      success: true,
      message: 'A new verification code has been sent to your email.',
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to resend code. Please try again.' },
      { status: 500 }
    );
  }
}
