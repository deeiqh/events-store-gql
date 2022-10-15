import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as SendGrid from '@sendgrid/mail';

@Injectable()
export class SendgridService {
  constructor(private readonly configService: ConfigService) {
    SendGrid.setApiKey(
      this.configService.get<string>('SENDGRID_API_KEY') as string,
    );
  }

  async send(mail: SendGrid.MailDataRequired): Promise<string> {
    try {
      await SendGrid.send(mail);
      return 'Mail sent';
    } catch (error) {
      throw new ServiceUnavailableException("Can't send the mail");
    }
  }
}
