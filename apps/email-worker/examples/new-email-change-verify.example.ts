/**
 * Example: New Email Change Verification
 * 
 * This example demonstrates how to use the new email change verification endpoint
 * to send a confirmation email to a user's new email address.
 */

import { EmailRequestDto } from '../src/dto/email.dto';

// Example email request for new email change verification
const newEmailChangeRequest: EmailRequestDto = {
  type: 'new-email-change-verify',
  data: {
    email: 'newemail@example.com',
    otpCode: '123456',
  },
};

// Example usage with fetch API
async function sendNewEmailChangeVerification() {
  try {
    const response = await fetch('http://localhost:3000/email-worker/new-email-change-verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newEmailChangeRequest),
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Email sent successfully:', result.message);
      console.log('📧 Sent to:', result.email);
    } else {
      console.error('❌ Failed to send email:', result.error);
    }
  } catch (error) {
    console.error('❌ Request failed:', error);
  }
}

// Example usage with RabbitMQ (microservice)
async function queueNewEmailChangeVerification() {
  try {
    const response = await fetch('http://localhost:3000/email-worker/queue', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newEmailChangeRequest),
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Email queued successfully:', result.message);
    } else {
      console.error('❌ Failed to queue email:', result.error);
    }
  } catch (error) {
    console.error('❌ Request failed:', error);
  }
}

// Example usage with direct email sending
async function sendDirectNewEmailChangeVerification() {
  try {
    const response = await fetch('http://localhost:3000/email-worker/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newEmailChangeRequest),
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Email sent directly:', result.message);
    } else {
      console.error('❌ Failed to send email:', result.error);
    }
  } catch (error) {
    console.error('❌ Request failed:', error);
  }
}

// Export for use in other modules
export {
  newEmailChangeRequest,
  sendNewEmailChangeVerification,
  queueNewEmailChangeVerification,
  sendDirectNewEmailChangeVerification,
};

// Example usage in a user service
export class UserEmailService {
  async sendNewEmailChangeVerification(newEmail: string, otpCode: string) {
    const request: EmailRequestDto = {
      type: 'new-email-change-verify',
      data: {
        email: newEmail,
        otpCode: otpCode,
      },
    };

    // You can use any of the three methods above
    // For microservice architecture, use the queue method
    return await this.queueEmail(request);
  }

  private async queueEmail(request: EmailRequestDto) {
    // Implementation would depend on your microservice setup
    // This is just an example
    console.log('Queueing email request:', request);
    return { success: true, message: 'Email queued' };
  }
}
