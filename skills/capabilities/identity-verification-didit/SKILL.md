---
name: identity-verification-didit
description: Identity verification via phone/email OTP and AML screening using Didit API
source: orthogonal
---


# Didit - Identity Verification API

## Setup

Read your credentials from ~/.gooseworks/credentials.json:
```bash
export GOOSEWORKS_API_KEY=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json'))['api_key'])")
export GOOSEWORKS_API_BASE=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json')).get('api_base','https://api.gooseworks.ai'))")
```

If ~/.gooseworks/credentials.json does not exist, tell the user to run: `npx gooseworks login`

All endpoints use Bearer auth: `-H "Authorization: Bearer $GOOSEWORKS_API_KEY"`


Verify user identities through phone/email OTP codes and screen against AML databases.

## Capabilities

- **Send Email Code**: Send a one-time verification code to an email address
- **Check Phone Code**: Verify a one-time code sent to a phone number (free)
- **Send Phone Code**: Send a one-time verification code to a phone number
- **AML Screening**: The AML Screening API allows you to screen individuals or companies against global watchlists and high-risk databases
- **Check Email Code**: Verify a code sent to an email address (free)
- **Database Validation API**: Validate user-provided identity data against authoritative national and global data sources

## Usage

### Send Email Code
Send a one-time verification code to an email address.

Parameters:
- email* (string) - Email address to verify
- options (object) - Options object with code_size (4-8, default 6) and locale (e.g. en-US)
- signals (object) - Fraud detection signals: ip, device_id, user_agent
- vendor_data (string) - Unique identifier for vendor/user (UUID or email) for session tracking

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"didit","path":"/v3/email/send","body":{"email":"user@example.com"}}'
```

### Check Phone Code (free)
Verify a one-time code sent to a phone number. Maximum of three verification attempts per code.

Parameters:
- phone_number* (string) - Phone number in E.164 format (e.g. +14155552671)
- code* (string) - Verification code (4-8 characters)
- duplicated_phone_number_action (string) - Action for duplicated numbers: NO_ACTION (default) or DECLINE
- disposable_number_action (string) - Action for disposable numbers: NO_ACTION (default) or DECLINE
- voip_number_action (string) - Action for VoIP numbers: NO_ACTION (default) or DECLINE

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"didit","path":"/v3/phone/check","body":{"phone_number":"+1234567890","code":"123456"}}'
```

### Send Phone Code
Send a one-time verification code to a phone number.

Parameters:
- phone_number* (string) - Phone number in E.164 format (e.g. +14155552671)
- options (object) - Options object with code_size (4-8, default 6), locale (e.g. en-US), preferred_channel (sms/whatsapp/telegram/voice, default whatsapp)
- signals (object) - Fraud detection signals: ip, device_id, device_platform (android/ios/ipados/tvos/web), device_model, os_version, app_version, user_agent
- vendor_data (string) - Unique identifier for vendor/user (UUID or email) for session tracking

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"didit","path":"/v3/phone/send","body":{"phone_number":"+1234567890"}}'
```

### AML Screening
The AML Screening API allows you to screen individuals or companies against global watchlists and high-risk databases. This API provides real-time screening capabilities to detect potential matches and mitigate risks associated with financial fraud and terrorism.

Parameters:
- full_name* (string) - Full name of the person or company to be screened.
- entity_type (string) - Type of entity to screen. Either 'person' or 'company'. Defaults to 'person'.
- date_of_birth (date) - Date of birth for persons or incorporation date for companies, with format: YYYY-MM-DD. For example, `1990-05-15`.
- nationality (string) - Nationality of the person to be screened with format ISO 3166-1 alpha-2. For example: `ES`. Only applicable for person entity type.
- document_number (string) - Document number of the person to be screened. Only applicable for person entity type.
- aml_score_approve_threshold (number) - Score threshold below which hits are auto-approved (0-100). Hits with match scores below this threshold will be marked as approved. Default: 86.
- aml_score_review_threshold (number) - Score threshold above which hits are auto-declined (0-100). Hits with match scores above this threshold will be declined. Scores between approve and review thresholds require manual review. Default: 100.
- aml_name_weight (integer) - Weight for name similarity in match score calculation (0-100). The sum of aml_name_weight + aml_dob_weight + aml_country_weight must equal 100. Default: 60.
- aml_dob_weight (integer) - Weight for date of birth in match score calculation (0-100). The sum of aml_name_weight + aml_dob_weight + aml_country_weight must equal 100. Default: 25.
- aml_country_weight (integer) - Weight for country/nationality in match score calculation (0-100). The sum of aml_name_weight + aml_dob_weight + aml_country_weight must equal 100. Default: 15.
- aml_match_score_threshold (integer) - Match score threshold (0-100) that determines if a hit is a False Positive or Unreviewed (Possible Match). Hits with match_score below this are marked as 'False Positive' and excluded from risk assessment. Hits at or above are 'Unreviewed' (Possible Match). Default: 93.
- include_adverse_media (boolean) - Wheter to include adverse media in the screening. If included, the request will take approximately 10 seconds.
- include_ongoing_monitoring (boolean) - Whether to include ongoing monitoring in the screening. If included, the save_api_request must be included as well, otherwise it will raise an error.
- save_api_request (boolean) - Whether to save this API request. If true, then it will appear on the `Manual Checks` section in the Business Console.
- vendor_data (string) - A unique identifier for the vendor or user, such as a UUID or email. This field enables proper session tracking and user data aggregation across multiple verification sessions.

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"didit","path":"/v3/aml","body":{"full_name":"John Doe"}}'
```

### Check Email Code (free)
Verify a code sent to an email address.

Parameters:
- email* (string) - Email address to verify
- code* (string) - Verification code (4-8 characters)
- duplicated_email_action (string) - Action for duplicated emails: NO_ACTION (default) or DECLINE
- breached_email_action (string) - Action for breached emails: NO_ACTION (default) or DECLINE
- disposable_email_action (string) - Action for disposable emails: NO_ACTION (default) or DECLINE
- undeliverable_email_action (string) - Action for undeliverable emails: NO_ACTION (default) or DECLINE

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"didit","path":"/v3/email/check","body":{"email":"user@example.com","code":"123456"}}'
```

### Database Validation API
Validate user-provided identity data against authoritative national and global data sources.

Parameters:
- issuing_state* (string) - ISO 3166-1 alpha-3 country code. Valid: ARG, BOL, BRA, CHL, COL, CRI, DOM, ECU, ESP, GTM, HND, MEX, PAN, PER, PRY, SLV, URY, VEN
- validation_type* (string) - Validation type: one_by_one or two_by_two
- identification_number* (string) - Universal ID field - auto-maps to country-specific format
- document_type (string) - Document type: P (Passport), DL (Driver License), ID (National ID), RP (Residence Permit). Required for some countries.
- expiration_date (string) - Document expiration date YYYY-MM-DD. Required for some countries (e.g. ESP).
- first_name (string) - First name
- last_name (string) - Last name
- date_of_birth (string) - Date of birth YYYY-MM-DD
- nationality (string) - ISO 3166-1 alpha-3 nationality code
- address (string) - Residential address

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"didit","path":"/v3/database-validation","body":{"issuing_state":"ESP","validation_type":"one_by_one","identification_number":"12345678A"}}'
```

## Use Cases

1. **User Registration**: Verify phone/email during signup
2. **Two-Factor Authentication**: Add OTP verification to login flows
3. **KYC Compliance**: Validate identity data for financial services
4. **AML Compliance**: Screen customers against sanctions and watchlists

## Discover More

For full endpoint details and parameters:

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/search \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"didit API endpoints"}' List all endpoints
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/details \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"didit","path":"/v3/email/send"}'   # Get endpoint details
```
