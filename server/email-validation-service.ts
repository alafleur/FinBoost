/**
 * STEP 7: Centralized Email Validation Service
 * 
 * Comprehensive email validation system for PayPal disbursements with:
 * - Multi-layer validation architecture
 * - PayPal-specific validation rules
 * - Disposable email detection
 * - Placeholder and test email rejection
 * - Security-focused validation patterns
 * - Detailed error classification and logging
 * - PII-safe masking utilities
 */

// ============================================================================
// STEP 7: TYPE DEFINITIONS
// ============================================================================

export interface EmailValidationResult {
  isValid: boolean;
  email?: string; // Normalized email if valid
  errorCode?: string;
  errorMessage?: string;
  severity: 'error' | 'warning' | 'info';
  suggestions?: string[];
}

export interface EmailValidationConfig {
  enableDisposableEmailCheck: boolean;
  enableDomainWhitelist: boolean;
  enablePlaceholderCheck: boolean;
  enableSecurityValidation: boolean;
  maxLength: number;
  allowInternationalDomains: boolean;
}

export interface EmailValidationStats {
  totalValidated: number;
  totalValid: number;
  totalInvalid: number;
  errorBreakdown: Record<string, number>;
  lastReset: Date;
}

// ============================================================================
// STEP 7: CENTRALIZED EMAIL VALIDATION SERVICE
// ============================================================================

export class EmailValidationService {
  private static instance: EmailValidationService;
  private config: EmailValidationConfig;
  private stats: EmailValidationStats;

  // STEP 7: PayPal-specific email constraints
  private static readonly PAYPAL_MAX_EMAIL_LENGTH = 254; // RFC 5321 standard
  private static readonly PAYPAL_MIN_EMAIL_LENGTH = 6; // Minimum realistic email

  // STEP 7: Known problematic domains and patterns
  private static readonly DISPOSABLE_EMAIL_DOMAINS = new Set([
    '10minutemail.com', 'tempmail.org', 'guerrillamail.com', 'mailinator.com',
    'throwaway.email', 'temp-mail.org', 'getnada.com', 'maildrop.cc',
    'trashmail.com', 'yopmail.com', 'mailcatch.com', 'sharklasers.com',
    'grr.la', 'emailondeck.com', 'spam4.me', 'mytrashmail.com'
  ]);

  private static readonly PLACEHOLDER_PATTERNS = [
    /^test@/i, /^none@/i, /^noreply@/i, /^no-reply@/i,
    /^placeholder@/i, /^example@/i, /^dummy@/i, /^fake@/i,
    /^invalid@/i, /^temp@/i, /^temporary@/i, /^sample@/i,
    /^demo@/i, /^admin@example\./i, /^user@example\./i,
    /^test\+.*@/i, /^.*\+test@/i,
    // Block problematic test domains (STEP 2: Postmark finalization)
    /^admin@getfinboost\.com$/i,
    /@txn\.getfinboost\.com$/i,
    /^bounced\.production@test\.com$/i,
    /^.*@.*\.test$/i  // Block all .test domains
  ];

  private static readonly SECURITY_RISK_PATTERNS = [
    /[<>'"&\[\]{}\\`]/,  // HTML/Script injection characters
    /\s{2,}/,             // Multiple consecutive spaces
    /^[.-]/,              // Starting with dots or dashes
    /[.-]$/,              // Ending with dots or dashes
    /\.{2,}/,             // Multiple consecutive dots
    /@\./, /\.@/,         // Dots adjacent to @
    /@@/,                 // Multiple @ symbols
  ];

  private static readonly COMMON_TYPO_DOMAINS = new Map([
    ['gmial.com', 'gmail.com'],
    ['gmai.com', 'gmail.com'],
    ['gmail.co', 'gmail.com'],
    ['yahooo.com', 'yahoo.com'],
    ['yaho.com', 'yahoo.com'],
    ['hotmial.com', 'hotmail.com'],
    ['hotmai.com', 'hotmail.com'],
    ['outlok.com', 'outlook.com'],
    ['outloo.com', 'outlook.com']
  ]);

  constructor(config?: Partial<EmailValidationConfig>) {
    this.config = {
      enableDisposableEmailCheck: true,
      enableDomainWhitelist: false,
      enablePlaceholderCheck: true,
      enableSecurityValidation: true,
      maxLength: EmailValidationService.PAYPAL_MAX_EMAIL_LENGTH,
      allowInternationalDomains: true,
      ...config
    };

    this.stats = {
      totalValidated: 0,
      totalValid: 0,
      totalInvalid: 0,
      errorBreakdown: {},
      lastReset: new Date()
    };
  }

  public static getInstance(config?: Partial<EmailValidationConfig>): EmailValidationService {
    if (!EmailValidationService.instance) {
      EmailValidationService.instance = new EmailValidationService(config);
    }
    return EmailValidationService.instance;
  }

  // ============================================================================
  // STEP 7: COMPREHENSIVE EMAIL VALIDATION
  // ============================================================================

  /**
   * Primary validation method - comprehensive multi-layer validation
   */
  public validateEmail(email: string, context: string = 'general'): EmailValidationResult {
    this.stats.totalValidated++;
    
    console.log(`[EMAIL VALIDATION] Starting validation for ${this.maskEmail(email)} (context: ${context})`);

    // Layer 1: Basic format and structure validation
    const basicValidation = this.validateBasicFormat(email);
    if (!basicValidation.isValid) {
      this.recordError(basicValidation.errorCode!);
      console.warn(`[EMAIL VALIDATION] Basic format failed for ${this.maskEmail(email)}: ${basicValidation.errorCode}`);
      return basicValidation;
    }

    const normalizedEmail = this.normalizeEmail(email);

    // Layer 2: Length and character validation
    const lengthValidation = this.validateLength(normalizedEmail);
    if (!lengthValidation.isValid) {
      this.recordError(lengthValidation.errorCode!);
      return lengthValidation;
    }

    // Layer 3: Security validation
    if (this.config.enableSecurityValidation) {
      const securityValidation = this.validateSecurity(normalizedEmail);
      if (!securityValidation.isValid) {
        this.recordError(securityValidation.errorCode!);
        console.error(`[EMAIL VALIDATION] Security validation failed for ${this.maskEmail(normalizedEmail)}: ${securityValidation.errorCode}`);
        return securityValidation;
      }
    }

    // Layer 4: Placeholder and test email validation
    if (this.config.enablePlaceholderCheck) {
      const placeholderValidation = this.validatePlaceholders(normalizedEmail);
      if (!placeholderValidation.isValid) {
        this.recordError(placeholderValidation.errorCode!);
        console.warn(`[EMAIL VALIDATION] Placeholder check failed for ${this.maskEmail(normalizedEmail)}: ${placeholderValidation.errorCode}`);
        return placeholderValidation;
      }
    }

    // Layer 5: Disposable email validation
    if (this.config.enableDisposableEmailCheck) {
      const disposableValidation = this.validateDisposableEmail(normalizedEmail);
      if (!disposableValidation.isValid) {
        this.recordError(disposableValidation.errorCode!);
        console.warn(`[EMAIL VALIDATION] Disposable email detected: ${this.maskEmail(normalizedEmail)}: ${disposableValidation.errorCode}`);
        return disposableValidation;
      }
    }

    // Layer 6: Domain typo detection and suggestions
    const typoSuggestions = this.detectTypos(normalizedEmail);

    this.stats.totalValid++;
    console.log(`[EMAIL VALIDATION] ✅ Email validated successfully: ${this.maskEmail(normalizedEmail)}`);

    return {
      isValid: true,
      email: normalizedEmail,
      severity: 'info',
      suggestions: typoSuggestions.length > 0 ? typoSuggestions : undefined
    };
  }

  // ============================================================================
  // STEP 7: VALIDATION LAYER IMPLEMENTATIONS
  // ============================================================================

  private validateBasicFormat(email: string): EmailValidationResult {
    if (!email || typeof email !== 'string') {
      return {
        isValid: false,
        errorCode: 'EMAIL_NULL_OR_INVALID_TYPE',
        errorMessage: 'Email must be a non-empty string',
        severity: 'error'
      };
    }

    const trimmed = email.trim();
    if (trimmed.length === 0) {
      return {
        isValid: false,
        errorCode: 'EMAIL_EMPTY',
        errorMessage: 'Email cannot be empty',
        severity: 'error'
      };
    }

    // RFC 5322 compliant email regex (simplified but comprehensive)
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    
    if (!emailRegex.test(trimmed)) {
      return {
        isValid: false,
        errorCode: 'EMAIL_INVALID_FORMAT',
        errorMessage: 'Email format does not meet RFC 5322 standards',
        severity: 'error'
      };
    }

    // Must contain exactly one @ symbol
    const atCount = (trimmed.match(/@/g) || []).length;
    if (atCount !== 1) {
      return {
        isValid: false,
        errorCode: 'EMAIL_INVALID_AT_SYMBOL_COUNT',
        errorMessage: `Email must contain exactly one @ symbol, found ${atCount}`,
        severity: 'error'
      };
    }

    const [localPart, domain] = trimmed.split('@');
    
    // Validate local part
    if (localPart.length === 0 || localPart.length > 64) {
      return {
        isValid: false,
        errorCode: 'EMAIL_INVALID_LOCAL_PART_LENGTH',
        errorMessage: 'Email local part must be 1-64 characters',
        severity: 'error'
      };
    }

    // Validate domain part
    if (domain.length === 0 || domain.length > 253) {
      return {
        isValid: false,
        errorCode: 'EMAIL_INVALID_DOMAIN_LENGTH',
        errorMessage: 'Email domain must be 1-253 characters',
        severity: 'error'
      };
    }

    // Domain must contain at least one dot
    if (!domain.includes('.')) {
      return {
        isValid: false,
        errorCode: 'EMAIL_DOMAIN_NO_TLD',
        errorMessage: 'Email domain must contain a top-level domain',
        severity: 'error'
      };
    }

    return { isValid: true, severity: 'info' };
  }

  private validateLength(email: string): EmailValidationResult {
    if (email.length < EmailValidationService.PAYPAL_MIN_EMAIL_LENGTH) {
      return {
        isValid: false,
        errorCode: 'EMAIL_TOO_SHORT',
        errorMessage: `Email must be at least ${EmailValidationService.PAYPAL_MIN_EMAIL_LENGTH} characters`,
        severity: 'error'
      };
    }

    if (email.length > this.config.maxLength) {
      return {
        isValid: false,
        errorCode: 'EMAIL_TOO_LONG',
        errorMessage: `Email exceeds maximum length of ${this.config.maxLength} characters`,
        severity: 'error'
      };
    }

    return { isValid: true, severity: 'info' };
  }

  private validateSecurity(email: string): EmailValidationResult {
    // Check for dangerous characters that could cause injection attacks
    for (const pattern of EmailValidationService.SECURITY_RISK_PATTERNS) {
      if (pattern.test(email)) {
        return {
          isValid: false,
          errorCode: 'EMAIL_SECURITY_RISK',
          errorMessage: 'Email contains potentially dangerous characters',
          severity: 'error'
        };
      }
    }

    // Check for suspicious patterns
    if (email.includes('..')) {
      return {
        isValid: false,
        errorCode: 'EMAIL_CONSECUTIVE_DOTS',
        errorMessage: 'Email contains consecutive dots',
        severity: 'error'
      };
    }

    if (email.startsWith('.') || email.endsWith('.')) {
      return {
        isValid: false,
        errorCode: 'EMAIL_STARTS_OR_ENDS_WITH_DOT',
        errorMessage: 'Email cannot start or end with a dot',
        severity: 'error'
      };
    }

    return { isValid: true, severity: 'info' };
  }

  private validatePlaceholders(email: string): EmailValidationResult {
    const normalizedEmail = email.toLowerCase();

    for (const pattern of EmailValidationService.PLACEHOLDER_PATTERNS) {
      if (pattern.test(normalizedEmail)) {
        return {
          isValid: false,
          errorCode: 'EMAIL_BLOCKED_TEST_ADDRESS',
          errorMessage: 'Email appears to be a placeholder or test email',
          severity: 'error'
        };
      }
    }

    // Additional context-specific placeholder checks
    const placeholderKeywords = ['test', 'example', 'sample', 'demo', 'fake', 'dummy', 'placeholder'];
    const [localPart, domain] = normalizedEmail.split('@');
    
    for (const keyword of placeholderKeywords) {
      if (localPart.includes(keyword) && domain.includes('example')) {
        return {
          isValid: false,
          errorCode: 'EMAIL_PLACEHOLDER_PATTERN',
          errorMessage: 'Email matches placeholder pattern',
          severity: 'error'
        };
      }
    }

    return { isValid: true, severity: 'info' };
  }

  private validateDisposableEmail(email: string): EmailValidationResult {
    const domain = email.split('@')[1]?.toLowerCase();
    
    if (!domain) {
      return {
        isValid: false,
        errorCode: 'EMAIL_NO_DOMAIN',
        errorMessage: 'Email has no domain part',
        severity: 'error'
      };
    }

    if (EmailValidationService.DISPOSABLE_EMAIL_DOMAINS.has(domain)) {
      return {
        isValid: false,
        errorCode: 'EMAIL_DISPOSABLE_DOMAIN',
        errorMessage: 'Email uses a disposable/temporary email service',
        severity: 'error'
      };
    }

    // Check for common disposable email patterns
    const disposablePatterns = [
      /temp.*mail/i, /throwaway/i, /disposable/i, /trash/i, /spam/i,
      /10min/i, /mailinator/i, /guerrilla/i
    ];

    for (const pattern of disposablePatterns) {
      if (pattern.test(domain)) {
        return {
          isValid: false,
          errorCode: 'EMAIL_DISPOSABLE_PATTERN',
          errorMessage: 'Email domain suggests disposable/temporary service',
          severity: 'warning'
        };
      }
    }

    return { isValid: true, severity: 'info' };
  }

  private detectTypos(email: string): string[] {
    const suggestions: string[] = [];
    const domain = email.split('@')[1]?.toLowerCase();
    const localPart = email.split('@')[0];

    if (!domain) return suggestions;

    // Check for common domain typos
    const correctedDomain = EmailValidationService.COMMON_TYPO_DOMAINS.get(domain);
    if (correctedDomain) {
      suggestions.push(`${localPart}@${correctedDomain}`);
    }

    return suggestions;
  }

  // ============================================================================
  // STEP 7: UTILITY METHODS
  // ============================================================================

  public normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  public maskEmail(email: string): string {
    if (!email || typeof email !== 'string') return 'invalid_email';
    
    const parts = email.split('@');
    if (parts.length !== 2) return 'malformed_email';
    
    const localPart = parts[0];
    const domain = parts[1];
    
    if (localPart.length <= 3) {
      return `${localPart.charAt(0)}***@${domain}`;
    }
    
    return `${localPart.substring(0, 2)}***@${domain}`;
  }

  private recordError(errorCode: string): void {
    this.stats.totalInvalid++;
    this.stats.errorBreakdown[errorCode] = (this.stats.errorBreakdown[errorCode] || 0) + 1;
  }

  // ============================================================================
  // STEP 7: BATCH VALIDATION AND REPORTING
  // ============================================================================

  public validateEmailBatch(emails: string[], context: string = 'batch'): {
    results: EmailValidationResult[];
    summary: {
      total: number;
      valid: number;
      invalid: number;
      errorBreakdown: Record<string, number>;
    };
  } {
    console.log(`[EMAIL VALIDATION] Starting batch validation of ${emails.length} emails (context: ${context})`);
    
    const results = emails.map(email => this.validateEmail(email, context));
    const valid = results.filter(r => r.isValid).length;
    const invalid = results.length - valid;
    
    const errorBreakdown: Record<string, number> = {};
    results.forEach(result => {
      if (!result.isValid && result.errorCode) {
        errorBreakdown[result.errorCode] = (errorBreakdown[result.errorCode] || 0) + 1;
      }
    });

    console.log(`[EMAIL VALIDATION] Batch validation complete: ${valid}/${results.length} valid`);

    return {
      results,
      summary: {
        total: results.length,
        valid,
        invalid,
        errorBreakdown
      }
    };
  }

  public getValidationStats(): EmailValidationStats {
    return { ...this.stats };
  }

  public resetStats(): void {
    this.stats = {
      totalValidated: 0,
      totalValid: 0,
      totalInvalid: 0,
      errorBreakdown: {},
      lastReset: new Date()
    };
  }

  public updateConfig(newConfig: Partial<EmailValidationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('[EMAIL VALIDATION] Configuration updated:', newConfig);
  }
}

// ============================================================================
// STEP 7: SINGLETON INSTANCE EXPORT
// ============================================================================

export const emailValidationService = EmailValidationService.getInstance({
  enableDisposableEmailCheck: true,
  enableDomainWhitelist: false,
  enablePlaceholderCheck: true,
  enableSecurityValidation: true,
  maxLength: 254,
  allowInternationalDomains: true
});