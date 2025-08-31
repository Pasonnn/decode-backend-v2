# Two-Factor Authentication
POST   /users/2fa/enable                 # Enable 2FA
POST   /users/2fa/disable                # Disable 2FA
POST   /users/2fa/verify                 # Verify 2FA code
POST   /users/2fa/backup-codes           # Generate backup codes

# Privacy Settings
PUT    /users/privacy                    # Update privacy settings
GET    /users/privacy                    # Get privacy settings

# Account Recovery
POST   /users/recovery/initiate          # Initiate account recovery
POST   /users/recovery/verify            # Verify recovery code
POST   /users/recovery/reset             # Reset account

