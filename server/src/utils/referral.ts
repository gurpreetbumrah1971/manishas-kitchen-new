const REFERRAL_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export const generateReferralCode = (): string => {
  let code = 'MK';
  for (let i = 0; i < 6; i += 1) {
    code += REFERRAL_ALPHABET[Math.floor(Math.random() * REFERRAL_ALPHABET.length)];
  }
  return code;
};

export const normalizeReferralCode = (value: string): string =>
  String(value || '').trim().toUpperCase();

export const ensureCustomerReferralCode = async (db: any, customer: { id: number; referralCode: string | null | undefined }) => {
  if (customer.referralCode) return customer.referralCode;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = generateReferralCode();
    try {
      await db.customer.update({
        where: { id: customer.id },
        data: { referralCode: code },
      });
      return code;
    } catch (error: any) {
      if (error && error.code !== 'P2002') throw error;
    }
  }

  throw new Error('Could not generate a unique referral code');
};
