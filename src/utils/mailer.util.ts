import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
export class MailerUtil extends SESClient {
  constructor() {
    super({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }
  createSendEmailCommand(
    toAddress: string,
    fromAddress: string,
    subject: string,
    html: string,
  ) {
    return new SendEmailCommand({
      Destination: {
        /* required */
        CcAddresses: [
          /* more items */
        ],
        ToAddresses: [
          toAddress,
          /* more To-email addresses */
        ],
      },
      Message: {
        /* required */
        Body: {
          /* required */
          Html: {
            Charset: 'UTF-8',
            Data: html,
          },
        },
        Subject: {
          Charset: 'UTF-8',
          Data: subject,
        },
      },
      Source: fromAddress,
      ReplyToAddresses: [
        /* more items */
      ],
    });
  }

  async sendMail(to: string, subject: string, html: string) {
    const sendEmailCommand = this.createSendEmailCommand(
      to,
      `noreply@${process.env.DOMAIN_NAME}`,
      subject,
      html,
    );

    try {
      return await this.send(sendEmailCommand);
    } catch (e) {
      console.error(e);
      return e;
    }
  }
}
