import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { Injectable } from '@nestjs/common';
@Injectable()
export class MailerUtil {
  private readonly sesClient: SESClient;

  constructor() {
    this.sesClient = new SESClient({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }
  private createSendEmailCommand(
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
      return await this.sesClient.send(sendEmailCommand);
    } catch (e) {
      throw new Error(`Failed to send email: ${e.message}`);
    }
  }
}
