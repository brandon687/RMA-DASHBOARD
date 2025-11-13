/**
 * IMEI Validation Service
 *
 * Handles IMEI validation and sanitization
 * - Valid IMEI: 15 digits, starts with 35
 * - Handles Excel formatting issues (scientific notation, extra characters)
 * - Flags invalid IMEIs for admin review
 */

class IMEIValidator {
    /**
     * Clean IMEI from Excel formatting issues
     * Excel often converts long numbers to scientific notation or adds decimals
     */
    static sanitizeIMEI(rawValue) {
        if (!rawValue) return null;

        const strValue = String(rawValue);

        // Handle scientific notation (e.g., 3.57069E+14 or 3.57069e+14)
        if (strValue.includes('E') || strValue.includes('e')) {
            // Extract mantissa and exponent
            const [mantissa, exponent] = strValue.toLowerCase().split('e');
            const exp = parseInt(exponent);

            // Remove decimal point from mantissa
            const mantissaDigits = mantissa.replace('.', '');

            // Reconstruct the full number
            // For 3.57069E+14: mantissa=357069, exp=14, need to add 8 zeros (14-6=8)
            const zerosToAdd = exp - (mantissaDigits.length - 1);
            let reconstructed = mantissaDigits + '0'.repeat(Math.max(0, zerosToAdd));

            // Ensure it's 15 digits
            if (reconstructed.length > 15) {
                reconstructed = reconstructed.substring(0, 15);
            } else if (reconstructed.length < 15) {
                // Pad with zeros at the end
                reconstructed = reconstructed + '0'.repeat(15 - reconstructed.length);
            }

            return reconstructed;
        }

        // Convert to string and remove all non-digit characters
        let cleaned = strValue.replace(/[^0-9]/g, '');

        // Truncate if too long
        if (cleaned.length > 15) {
            cleaned = cleaned.substring(0, 15);
        }

        // Pad with zeros if too short but looks like IMEI
        if (cleaned.length >= 13 && cleaned.length < 15 && cleaned.startsWith('35')) {
            cleaned = cleaned + '0'.repeat(15 - cleaned.length);
        }

        return cleaned;
    }

    /**
     * Validate IMEI according to requirements:
     * 1. Must be exactly 15 digits
     * 2. Must start with 35
     */
    static validate(imei) {
        const sanitized = this.sanitizeIMEI(imei);

        const result = {
            original: imei,
            sanitized: sanitized,
            isValid: false,
            errors: [],
            warnings: []
        };

        // Check if sanitized value exists
        if (!sanitized) {
            result.errors.push('IMEI is empty or null');
            return result;
        }

        // Check length
        if (sanitized.length !== 15) {
            result.errors.push(`IMEI must be 15 digits (found ${sanitized.length})`);
        }

        // Check if starts with 35
        if (!sanitized.startsWith('35')) {
            result.errors.push('IMEI must start with 35');
        }

        // Check if all characters are digits
        if (!/^\d+$/.test(sanitized)) {
            result.errors.push('IMEI must contain only digits');
        }

        // Check for common Excel issues
        if (String(imei).includes('E') || String(imei).includes('e')) {
            result.warnings.push('Original value was in scientific notation - converted automatically');
        }

        if (String(imei).includes('.')) {
            result.warnings.push('Original value contained decimal point - removed');
        }

        if (sanitized !== String(imei).replace(/[^0-9]/g, '')) {
            result.warnings.push('IMEI was cleaned from Excel formatting');
        }

        // Mark as valid if no errors
        result.isValid = result.errors.length === 0;

        return result;
    }

    /**
     * Validate and categorize a batch of IMEIs
     */
    static validateBatch(imeis) {
        const results = {
            valid: [],
            invalid: [],
            duplicates: [],
            summary: {
                total: imeis.length,
                validCount: 0,
                invalidCount: 0,
                duplicateCount: 0
            }
        };

        const seen = new Set();

        imeis.forEach((imei, index) => {
            const validation = this.validate(imei);

            const record = {
                index: index + 1,
                ...validation
            };

            if (validation.isValid) {
                // Check for duplicates within this batch
                if (seen.has(validation.sanitized)) {
                    record.errors.push('Duplicate IMEI within this submission');
                    results.duplicates.push(record);
                    results.summary.duplicateCount++;
                } else {
                    seen.add(validation.sanitized);
                    results.valid.push(record);
                    results.summary.validCount++;
                }
            } else {
                results.invalid.push(record);
                results.summary.invalidCount++;
            }
        });

        return results;
    }

    /**
     * Format validation result for display
     */
    static formatValidationMessage(validation) {
        if (validation.isValid) {
            let msg = `✓ Valid IMEI: ${validation.sanitized}`;
            if (validation.warnings.length > 0) {
                msg += ` (${validation.warnings.join(', ')})`;
            }
            return msg;
        } else {
            return `✗ Invalid IMEI: ${validation.original} - ${validation.errors.join(', ')}`;
        }
    }

    /**
     * Generate admin review flags
     */
    static generateReviewFlags(validation) {
        const flags = [];

        if (!validation.isValid) {
            flags.push({
                severity: 'ERROR',
                type: 'INVALID_IMEI',
                message: validation.errors.join('; '),
                requiresReview: true,
                blockApproval: true
            });
        }

        if (validation.warnings.length > 0) {
            flags.push({
                severity: 'WARNING',
                type: 'IMEI_FORMATTING_ISSUE',
                message: validation.warnings.join('; '),
                requiresReview: true,
                blockApproval: false
            });
        }

        return flags;
    }
}

module.exports = IMEIValidator;

// For testing
if (require.main === module) {
    console.log('='.repeat(80));
    console.log('IMEI VALIDATOR TEST');
    console.log('='.repeat(80));

    const testCases = [
        351454482579210,        // Valid IMEI as number
        '351454482579210',      // Valid IMEI as string
        '3.51454E+14',          // Scientific notation from Excel
        357068940352541,        // Valid IMEI
        '12345678901234',       // Invalid - doesn't start with 35
        '351454482579',         // Invalid - too short
        '3514544825792101234',  // Invalid - too long
        '35145448257921A',      // Invalid - contains letter
        null,                   // Invalid - null
        '',                     // Invalid - empty
        '350294957046001'       // Valid IMEI starting with 35
    ];

    console.log('\nTesting individual IMEIs:\n');
    testCases.forEach((imei, idx) => {
        const result = IMEIValidator.validate(imei);
        console.log(`Test ${idx + 1}: ${imei}`);
        console.log(`  ${IMEIValidator.formatValidationMessage(result)}`);
        if (result.errors.length > 0) {
            console.log(`  Errors: ${result.errors.join(', ')}`);
        }
        console.log('');
    });

    console.log('='.repeat(80));
    console.log('BATCH VALIDATION TEST');
    console.log('='.repeat(80));

    const batch = [351454482579210, 357068940352541, 351454482579210, '12345678901234'];
    const batchResult = IMEIValidator.validateBatch(batch);

    console.log(`\nTotal: ${batchResult.summary.total}`);
    console.log(`Valid: ${batchResult.summary.validCount}`);
    console.log(`Invalid: ${batchResult.summary.invalidCount}`);
    console.log(`Duplicates: ${batchResult.summary.duplicateCount}`);
}
