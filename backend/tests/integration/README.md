# Email Integration Tests

These integration tests actually send emails to `info@lewinnovation.com` to verify the email functionality works end-to-end.

## Prerequisites

1. Ensure the `.env` file is configured with valid SMTP credentials:
   ```env
   SMTP_HOST=your-smtp-host.com
   SMTP_PORT=2525
   SMTP_SECURE=false
   SMTP_REQUIRE_TLS=true
   SMTP_USER=your-email@example.com
   SMTP_PASS=your-smtp-password
   SMTP_FROM=your-email@example.com
   ```
   
   **Note**: Never commit actual SMTP credentials to the repository. Use environment variables or a secure secrets management system.

2. Database must be initialized and seeded (for end-to-end tests):
   ```bash
   npm run db:setup
   ```

## Running Integration Tests

### Run all integration tests:
```bash
npm run test:integration
```

### Run only email integration tests:
```bash
npm run test:email
```

### Run with verbose output:
```bash
RUN_INTEGRATION_TESTS=true npm test -- --testPathPattern=email.test --verbose
```

## What the Tests Do

1. **SMTP Connection Test**: Verifies the SMTP connection can be established
2. **Simple Email Test**: Sends a basic test email to `info@lewinnovation.com`
3. **PDF Attachment Test**: Sends an email with a PDF attachment
4. **Template Rendering Test**: Tests template variable substitution and sends rendered email
5. **End-to-End Test**: Fetches a job from the database, renders template, generates PDF, and sends email

## Important Notes

- These tests **actually send emails** - check `info@lewinnovation.com` inbox after running
- Tests are skipped by default unless `RUN_INTEGRATION_TESTS=true` is set
- Integration tests have longer timeouts (30-60 seconds) to account for network/SMTP delays
- Make sure you have a job in the database for the end-to-end test to work

## Troubleshooting

If tests fail:
1. Verify SMTP credentials in `.env` are correct
2. Check network connectivity
3. Ensure the SMTP server is accessible
4. Verify the recipient email `info@lewinnovation.com` is valid
5. Check SMTP server logs for any authentication or connection issues
