'use client';

import { useMemo } from 'react';

interface PasswordStrengthProps {
  password: string;
}

interface Requirement {
  label: string;
  met: boolean;
}

export default function PasswordStrength({ password }: PasswordStrengthProps) {
  const requirements: Requirement[] = useMemo(() => [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'One uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'One lowercase letter', met: /[a-z]/.test(password) },
    { label: 'One number', met: /[0-9]/.test(password) },
    { label: 'One special character', met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) },
  ], [password]);

  const metCount = requirements.filter((r) => r.met).length;
  const strength = metCount / requirements.length;

  const strengthLabel = useMemo(() => {
    if (strength === 0) return '';
    if (strength < 0.4) return 'Weak';
    if (strength < 0.8) return 'Medium';
    if (strength < 1) return 'Strong';
    return 'Very strong';
  }, [strength]);

  const strengthColor = useMemo(() => {
    if (strength < 0.4) return 'bg-danger-500';
    if (strength < 0.8) return 'bg-amber-500';
    return 'bg-success-500';
  }, [strength]);

  if (!password) return null;

  return (
    <div className="mt-2 space-y-2">
      {/* Strength bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-primary-100 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${strengthColor}`}
            style={{ width: `${strength * 100}%` }}
          />
        </div>
        <span className={`text-xs font-medium ${
          strength < 0.4 ? 'text-danger-500' :
          strength < 0.8 ? 'text-amber-500' :
          'text-success-500'
        }`}>
          {strengthLabel}
        </span>
      </div>

      {/* Requirements list */}
      <ul className="grid grid-cols-2 gap-1">
        {requirements.map((req, i) => (
          <li
            key={i}
            className={`flex items-center gap-1.5 text-xs ${
              req.met ? 'text-success-500' : 'text-primary-400'
            }`}
          >
            <span className="flex-shrink-0">
              {req.met ? (
                <svg className="w-3.5 h-3.5\" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" strokeWidth="2" />
                </svg>
              )}
            </span>
            {req.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
