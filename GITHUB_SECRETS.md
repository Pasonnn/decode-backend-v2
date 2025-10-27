# GitHub Secrets Configuration

This document outlines the required GitHub secrets for the Docker CI/CD pipeline to function properly.

## Required Secrets

### 1. Cloud Instance Access

| Secret Name | Description | Example | Required For |
|-------------|-------------|---------|--------------|
| `DROPLET_IP` | IP address of your cloud instance | `192.168.1.100` | SSH deployment |
| `DROPLET_USER` | SSH username for cloud instance | `ubuntu` | SSH deployment |
| `DROPLET_PASS` | SSH password for cloud instance | `your_secure_password` | SSH deployment |

### 2. Container Registry Access

| Secret Name | Description | Example | Required For |
|-------------|-------------|---------|--------------|
| `GHCR_PAT` | GitHub Personal Access Token with `read:packages` scope | `ghp_xxxxxxxxxxxx` | Pulling private images on cloud instance |

### 3. Notifications (Optional)

| Secret Name | Description | Example | Required For |
|-------------|-------------|---------|--------------|
| `DISCORD_WEBHOOK_URL` | Discord webhook URL for deployment notifications | `https://discordapp.com/api/webhooks/...` | Deployment notifications |

## How to Set Up Secrets

### 1. Navigate to Repository Settings
1. Go to your GitHub repository
2. Click on **Settings** tab
3. In the left sidebar, click **Secrets and variables** → **Actions**

### 2. Add Each Secret
1. Click **New repository secret**
2. Enter the secret name (exactly as listed above)
3. Enter the secret value
4. Click **Add secret**

## Secret Details

### DROPLET_IP
- The public IP address of your cloud instance
- Can be found in your cloud provider's dashboard
- Example: `203.0.113.1`

### DROPLET_USER
- The username for SSH access to your cloud instance
- Common values: `ubuntu`, `root`, `ec2-user`
- Must have Docker and Docker Compose installed

### DROPLET_PASS
- The password for SSH access to your cloud instance
- Should be a strong, unique password
- Consider using SSH keys instead for better security

### GHCR_PAT (GitHub Personal Access Token)
1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click **Generate new token (classic)**
3. Select scopes:
   - `read:packages` (to pull container images)
   - `write:packages` (if you want to push images from cloud instance)
4. Copy the generated token
5. Add it as `GHCR_PAT` secret

### DISCORD_WEBHOOK_URL (Optional)
1. Go to your Discord server
2. Right-click on the channel where you want notifications
3. Select "Edit Channel" → "Integrations" → "Webhooks"
4. Click "Create Webhook" or use existing webhook
5. Copy the webhook URL
6. Add it as `DISCORD_WEBHOOK_URL` secret

## Security Best Practices

1. **Use SSH Keys Instead of Passwords**: Consider setting up SSH key authentication instead of password authentication for better security.

2. **Rotate Secrets Regularly**: Change your secrets periodically, especially passwords and tokens.

3. **Minimal Permissions**: Only grant the minimum required permissions for each secret.

4. **Environment-Specific Secrets**: Use different secrets for different environments (staging, production).

## Troubleshooting

### Common Issues

1. **SSH Connection Failed**
   - Verify `DROPLET_IP` is correct and accessible
   - Check if SSH port (22) is open in firewall
   - Verify `DROPLET_USER` and `DROPLET_PASS` are correct

2. **Docker Login Failed**
   - Verify `GHCR_PAT` has correct permissions
   - Check if token is not expired
   - Ensure token has `read:packages` scope

3. **Image Pull Failed**
   - Verify images exist in GitHub Container Registry
   - Check if repository is private and token has access
   - Ensure image names match exactly

### Testing Secrets

You can test your secrets by running the workflow manually:

1. Go to **Actions** tab in your repository
2. Select **Docker Registry CI/CD Pipeline**
3. Click **Run workflow**
4. Select **deploy** action
5. Click **Run workflow**

## Cloud Instance Setup

Your cloud instance should have:

1. **Docker and Docker Compose installed**
2. **Git configured** with access to your repository
3. **Project directory** at `~/decode-backend-v2`
4. **Environment file** (`.env`) with all required variables
5. **Firewall rules** allowing:
   - Port 22 (SSH)
   - Port 4000 (API Gateway)
   - Port 4001 (Auth Service)
   - Port 4006 (Notification Service)

## Environment Variables

Your cloud instance `.env` file should include all variables from `docker.env.example`:

```bash
# Database URIs (cloud-hosted)
MONGO_URI=mongodb+srv://...
REDIS_URI=redis://...
NEO4J_URI=neo4j+s://...
RABBITMQ_URI=amqp://...

# JWT Secrets
JWT_ACCESS_TOKEN_SECRET=your_secret_here
JWT_SESSION_TOKEN_SECRET=your_secret_here
JWT_SERVICE_TOKEN_SECRET=your_secret_here

# Other required variables...
```

## Verification

After setting up all secrets, verify the setup by:

1. Running a test deployment
2. Checking container logs: `docker compose -f docker-compose.prod.yml logs`
3. Testing health endpoints: `curl http://your-ip:4000/health`
4. Verifying all services are running: `docker compose -f docker-compose.prod.yml ps`
