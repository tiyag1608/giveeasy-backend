/**
 * Tax Receipt Service (Section 80G Indian Income Tax Exemption)
 */
const generateTaxReceipt = (donation, campaign, cause, user) => {
  const donationDate = new Date(donation.createdAt || Date.now());
  const formattedDate = donationDate.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const pan = donation.taxReceipt?.panNumber || user?.panNumber || 'NOT_PROVIDED';
  const eligibleDeduction = Number((donation.amount * 0.5).toFixed(2)); // 50% deduction under Section 80G

  return {
    receiptHeader: {
      organizationName: cause?.ngoName || 'GiveEasy Foundation Trust',
      regNumber: cause?.ngoRegistrationNumber || '12A/80G/DEL/2021/AABTG1234F',
      taxExemptionSection: 'Section 80G (5)(vi) of the Income Tax Act, 1961',
      validity: 'Permanent Registration as per CBDT guidelines',
      address: 'GiveEasy Social Impact Hub, Tech Park, New Delhi, India',
    },
    receiptDetails: {
      receiptNumber: donation.receiptNumber,
      transactionId: donation.transactionId,
      dateOfDonation: formattedDate,
      modeOfPayment: donation.paymentMethod,
      currency: donation.currency || 'INR',
      amountReceived: donation.amount,
      amountInWords: numberToWordsINR(donation.amount) + ' Rupees Only',
      eligibleTaxDeductionAmount: eligibleDeduction,
      deductionRate: '50%',
    },
    donorDetails: {
      donorName: donation.donorName,
      donorEmail: donation.donorEmail,
      panNumber: pan,
      donorId: donation.donorId || null,
    },
    causeAndCampaign: {
      campaignTitle: campaign?.title || 'General Relief Fund',
      causeTitle: cause?.title || 'Humanitarian Aid',
      category: campaign?.category || cause?.category || 'Social Welfare',
    },
    certificateDisclaimer:
      'This certificate is an electronically generated valid receipt under Rule 18AB of the Income-tax Rules, 1962. No physical signature is required.',
  };
};

/**
 * Simple helper to format amount in Indian Rupees words
 */
function numberToWordsINR(num) {
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if (num === 0) return 'Zero';
  if (num < 20) return a[num];
  if (num < 100) return b[Math.floor(num / 10)] + (num % 10 !== 0 ? ' ' + a[num % 10] : '');
  if (num < 1000) return a[Math.floor(num / 100)] + ' Hundred' + (num % 100 !== 0 ? ' and ' + numberToWordsINR(num % 100) : '');
  if (num < 100000) return numberToWordsINR(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 !== 0 ? ' ' + numberToWordsINR(num % 1000) : '');
  if (num < 10000000) return numberToWordsINR(Math.floor(num / 100000)) + ' Lakh' + (num % 100000 !== 0 ? ' ' + numberToWordsINR(num % 100000) : '');
  return numberToWordsINR(Math.floor(num / 10000000)) + ' Crore' + (num % 10000000 !== 0 ? ' ' + numberToWordsINR(num % 10000000) : '');
}

module.exports = {
  generateTaxReceipt,
};
