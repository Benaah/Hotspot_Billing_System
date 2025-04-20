import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const whatsappFrom = process.env.TWILIO_WHATSAPP_FROM; // e.g. 'whatsapp:+14155238886'

const client = twilio(accountSid, authToken);

class WhatsAppService {
  async sendMessage(to, body) {
    try {
      const message = await client.messages.create({
        from: whatsappFrom,
        to: `whatsapp:${to}`,
        body,
      });
      console.log('WhatsApp message sent:', message.sid);
      return message;
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      throw error;
    }
  }

  async sendVoucher(to, voucherCode) {
    const body = `Your voucher code is: ${voucherCode}. Thank you for using our service!`;
    return this.sendMessage(to, body);
  }

  async sendTransactionStatus(to, transaction) {
    const body = `Transaction Update:\nID: ${transaction.id}\nAmount: ${transaction.amount}\nStatus: ${transaction.status}\nThank you for your payment.`;
    return this.sendMessage(to, body);
  }

  async sendPackageStatus(to, packageInfo) {
    const body = `Package Details:\nName: ${packageInfo.name}\nPrice: ${packageInfo.price}\nDescription: ${packageInfo.description}\nThank you for choosing our packages.`;
    return this.sendMessage(to, body);
  }

  async sendSubscriptionStatus(to, subscription) {
    const body = `Subscription Status:\nPackage: ${subscription.packageName}\nStatus: ${subscription.status}\nStart: ${subscription.startTime}\nEnd: ${subscription.endTime}\nThank you for subscribing.`;
    return this.sendMessage(to, body);
  }
}

export const whatsappService = new WhatsAppService();
