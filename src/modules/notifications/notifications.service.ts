import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { OrderDocument } from '../orders/schemas/order.schema';
import { UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class NotificationsService {
    private readonly logger = new Logger(NotificationsService.name);
    private transporter: nodemailer.Transporter;
    private readonly emailFrom: string;

    constructor(private configService: ConfigService) {
        this.emailFrom = this.configService.get<string>('email.from') || 'noreply@beauty-store.com';

        this.transporter = nodemailer.createTransport({
            host: this.configService.get<string>('email.host'),
            port: this.configService.get<number>('email.port'),
            auth: {
                user: this.configService.get<string>('email.user'),
                pass: this.configService.get<string>('email.pass'),
            },
        });
    }

    async sendOrderConfirmation(order: OrderDocument, user: UserDocument): Promise<void> {
        const itemsList = order.items
            .map((item) => `• ${item.productName} x${item.quantity} - $${item.subtotal.toFixed(2)}`)
            .join('\n');

        const emailContent = `
      <h1>¡Gracias por tu compra!</h1>
      <p>Hola ${user.name},</p>
      <p>Tu orden <strong>#${order._id}</strong> ha sido confirmada.</p>
      
      <h2>Resumen de la orden:</h2>
      <ul>
        ${order.items.map((item) => `<li>${item.productName} x${item.quantity} - $${item.subtotal.toFixed(2)}</li>`).join('')}
      </ul>
      
      <p><strong>Total: $${order.total.toFixed(2)} ${order.currency}</strong></p>
      
      ${order.receiptUrl ? `<p><a href="${order.receiptUrl}">Descargar recibo</a></p>` : ''}
      
      <p>¡Gracias por elegirnos!</p>
      <p>Beauty Store Team</p>
    `;

        try {
            await this.transporter.sendMail({
                from: this.emailFrom,
                to: user.email,
                subject: `Orden #${order._id} confirmada - Beauty Store`,
                html: emailContent,
                text: `
          ¡Gracias por tu compra!
          
          Hola ${user.name},
          Tu orden #${order._id} ha sido confirmada.
          
          Resumen:
          ${itemsList}
          
          Total: $${order.total.toFixed(2)} ${order.currency}
          
          ¡Gracias por elegirnos!
          Beauty Store Team
        `,
            });

            this.logger.log(`Confirmation email sent to ${user.email} for order ${order._id}`);
        } catch (error) {
            // Log error but don't throw - email failure should not block order confirmation
            this.logger.error(
                `Failed to send confirmation email to ${user.email}: ${(error as Error).message}`,
            );
            // Could save to a retry queue here for later retry
            throw error;
        }
    }
}
