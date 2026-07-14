## Run a Hyperlane validator for Terra Classic

Hyperlane lets Terra Classic publish validator checkpoints that other chains and relayers can read. This guide describes the operational setup for a Terra Classic Hyperlane validator using:

- an Ubuntu VPS
- Docker Compose
- an AWS S3 bucket for public checkpoint signatures
- an IAM user with write access to that bucket
- a funded Terra Classic signer address for validator announcements

> **Warning**
>
> Never commit private keys, AWS access keys, seed phrases, or `.env` files to Git. Keep secrets only on the VPS or in a secure secret manager.

## What the validator does

The Hyperlane validator watches the Terra Classic mailbox and merkle tree hook contracts. It then signs checkpoints and publishes signature metadata to S3.

Other Hyperlane participants must be able to read this S3 location. The bucket therefore needs public read and list access, while only your validator IAM user should be able to write objects.

Expected public S3 location format:

```text
s3://hyperlane-validator-signatures-[validator-name]-terraclassic/
```

Example:

```text
s3://hyperlane-validator-signatures-darksun-terraclassic/
```

## Prerequisites

You need:

- a Linux VPS running Ubuntu 24.04 or Debian
- Docker and Docker Compose
- a GitHub repository for versioned deployment files
- an AWS account
- an S3 bucket in the region you will use for Hyperlane, for example `eu-west-3`
- an IAM user dedicated to the Hyperlane validator
- a Terra Classic private key dedicated to Hyperlane signing
- a small amount of LUNC on the generated signer address to pay announcement gas

You do not need to run Hyperlane on the same machine as your Terra validator node. A separate VPS can use public or dedicated Terra Classic RPC, gRPC, and LCD endpoints.

## Recommended repository layout

Keep deployable files in Git, but keep secrets out of Git:

```text
hyperlane/
  vps/
    docker-compose.yml
    .env.example
    hyperlane/
      agent-config.docker.json
      validator.terraclassic.json
    scripts/
      deploy.sh
      update.sh
      healthcheck.sh
      install-systemd.sh
      install-cron-healthcheck.sh
```

The real `.env` file should exist only on the VPS and should be ignored by Git.

## Create the S3 bucket

Create an S3 bucket in the AWS region you want to use.

The bucket name should follow this convention so the validator name is visible to other operators:

**`hyperlane-validator-signatures-[validator-name]-terraclassic`**

Recommended naming pattern:

```text
hyperlane-validator-signatures-[validator-name]-terraclassic
```

Example:

```text
hyperlane-validator-signatures-darksun-terraclassic
```

Use these bucket settings:

- Object ownership: ACLs disabled
- Block public access: keep ACL-related public access blocked, but allow public bucket policies
- Versioning: disabled unless your operating policy requires it
- Default encryption: SSE-S3
- Object lock: disabled

## Bucket policy

The bucket must be publicly listable and readable. This allows other validators and relayers to discover and fetch checkpoint metadata.

Replace `<ACCOUNT_ID>`, `<IAM_USER>`, and `<BUCKET_NAME>`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicListHyperlaneValidatorSignatures",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:ListBucket",
      "Resource": "arn:aws:s3:::<BUCKET_NAME>"
    },
    {
      "Sid": "PublicReadHyperlaneValidatorSignatures",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::<BUCKET_NAME>/*"
    },
    {
      "Sid": "AllowHyperlaneValidatorWrite",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::<ACCOUNT_ID>:user/<IAM_USER>"
      },
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::<BUCKET_NAME>/*"
    }
  ]
}
```

Test public access:

```bash
curl -s "https://<BUCKET_NAME>.s3.<REGION>.amazonaws.com/?list-type=2"
```

If the bucket is public enough for Hyperlane discovery, the response should be XML listing output rather than `AccessDenied`.

## IAM policy for the validator user

Attach a policy to the IAM user used by the VPS. Replace `<BUCKET_NAME>` and `<KMS_KEY_ARN>` if you use KMS signing.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "HyperlaneValidatorBucketList",
      "Effect": "Allow",
      "Action": [
        "s3:ListBucket"
      ],
      "Resource": "arn:aws:s3:::<BUCKET_NAME>"
    },
    {
      "Sid": "HyperlaneValidatorBucketWrite",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:GetObject"
      ],
      "Resource": "arn:aws:s3:::<BUCKET_NAME>/*"
    }
  ]
}
```

If your validator configuration uses AWS KMS signing, add the KMS permissions required by your runbook. If your configuration uses a local Terra Classic private key, KMS is not required for the validator key itself.

## Create the Terra Classic signer key

Create a dedicated key. Do not reuse your validator operator key.

Example with `terrad`:

```bash
terrad keys add hyperlane-validator --keyring-backend file
```

Export the private key in the format expected by the Hyperlane agent.

The final value must usually look like:

```text
0x + 64 hexadecimal characters
```

If your export gives a base64-like key, convert it locally and verify the output before placing it in `.env`.

After deriving the signer address, send a small amount of LUNC to it. The validator uses this address to announce its signature storage location on-chain.

## VPS environment file

Create `vps/.env` on the VPS:

```bash
cd ~/hyperlane/vps
nano .env
chmod 600 .env
```

Example:

```bash
AWS_ACCESS_KEY_ID=<aws-access-key-id>
AWS_SECRET_ACCESS_KEY=<aws-secret-access-key>
AWS_REGION=eu-west-3
S3_BUCKET=hyperlane-validator-signatures-darksun-terraclassic
VALIDATOR_DB=/etc/data/db
TERRA_PRIVATE_KEY=0x...
```

Verify the Terra private key format without printing the key:

```bash
source .env
printf "%s\n" "${TERRA_PRIVATE_KEY:0:2}"
printf "%s\n" "${#TERRA_PRIVATE_KEY}"
printf "%s\n" "$TERRA_PRIVATE_KEY" | grep -Eq '^0x[0-9a-fA-F]{64}$' && echo "TERRA_PRIVATE_KEY format OK" || echo "TERRA_PRIVATE_KEY format INVALID"
```

Expected:

```text
0x
66
TERRA_PRIVATE_KEY format OK
```

## Validator configuration

`validator.terraclassic.json`:

```json
{
  "db": "/etc/data/db",
  "checkpointSyncer": {
    "type": "s3",
    "bucket": "hyperlane-validator-signatures-darksun-terraclassic",
    "region": "eu-west-3"
  },
  "originChainName": "terraclassic",
  "validator": {
    "type": "hexKey",
    "key": "${TERRA_PRIVATE_KEY}"
  },
  "chains": {
    "terraclassic": {
      "signer": {
        "type": "cosmosKey",
        "key": "${TERRA_PRIVATE_KEY}",
        "prefix": "terra"
      }
    }
  }
}
```

`agent-config.docker.json`:

```json
{
  "chains": {
    "terraclassic": {
      "name": "terraclassic",
      "domainId": 132556,
      "chainId": "columbus-5",
      "protocol": "cosmos",
      "rpcUrls": [
        {
          "http": "https://rpc.terra-classic.hexxagon.io"
        },
        {
          "http": "https://terra-classic-rpc.publicnode.com"
        }
      ],
      "grpcUrls": [
        {
          "http": "https://terra-classic-grpc.publicnode.com:443"
        }
      ],
      "restUrls": [
        {
          "http": "https://terra-classic-lcd.publicnode.com"
        }
      ],
      "canonicalAsset": "uluna",
      "bech32Prefix": "terra",
      "gasPrice": {
        "amount": "28325",
        "denom": "uluna"
      },
      "blocks": {
        "confirmations": 1,
        "estimateBlockTime": 3,
        "reorgPeriod": 1
      },
      "index": {
        "from": 28985045,
        "chunk": 5
      },
      "contractAddressBytes": 32,
      "mailbox": "0x4b911a4e9984913279a709a623f2120ba0c0a3967acd026b1301894398a96fed",
      "validatorAnnounce": "0x42e7b6e599b20c160b328b92453f2a9c63446e3be3a5a465bc31ba7d4a26f3f0",
      "interchainGasPaymaster": "0x5f793ba34a28e104c505896601bef42d414dc20313654fd8cab911b36efe522e",
      "merkleTreeHook": "0x3c7e0d10013db710c6b8322dab479e3f0950fc1dbe49a1cf3e9950429db9f8ca",
      "interchainSecurityModule": "0xe5c4262ca68f0f794ec1d1697b7f2632b4ab4b16c0aa8216175bc",
      "gas": {
        "adjustment": 1.5,
        "min_gas_amount": 2000000
      }
    }
  }
}
```

> **Note**
>
> Do not leave `grpcUrls` empty. The Hyperlane agent expects a valid gRPC definition for Terra Classic.

## Docker Compose

Example `docker-compose.yml`:

```yaml
services:
  validator-terraclassic:
    image: gcr.io/abacus-labs-dev/hyperlane-agent:1.7.0
    container_name: hpl-validator-terraclassic
    restart: unless-stopped
    user: root
    env_file:
      - .env
    environment:
      HYP_BASE_TRACING_LEVEL: ${HYP_BASE_TRACING_LEVEL:-debug}
      RUST_LOG: ${RUST_LOG:-debug,hyperlane=debug,validator=debug,hyperlane_cosmos=debug}
    entrypoint:
      - sh
      - -c
    command:
      - |
        rm -rf /app/config/* && \
        cp "/etc/hyperlane/agent-config.docker.json" "/app/config/agent-config.json" && \
        sed "s|\$${TERRA_PRIVATE_KEY}|$${TERRA_PRIVATE_KEY}|g" "/etc/hyperlane/validator.terraclassic.json" > "/tmp/validator.terraclassic.json" && \
        CONFIG_FILES="/tmp/validator.terraclassic.json" \
        ./validator --metrics 0.0.0.0:9090
    ports:
      - "9121:9090"
    volumes:
      - ./hyperlane:/etc/hyperlane
      - ./validator:/etc/data
```

Start the validator:

```bash
cd ~/hyperlane/vps
docker compose up -d
docker logs hpl-validator-terraclassic --tail 120
```

## Healthy output

Useful signs:

```text
Validator starting up
Successfully announced validator
Validator has announced signature storage location
Checkpoint submitter reached correctness checkpoint
```

Verify the container:

```bash
docker ps --filter name=hpl-validator-terraclassic
```

Verify recent logs:

```bash
docker logs hpl-validator-terraclassic --since 10m | grep -Ei "error|warn|panic|failed|announce|checkpoint|s3|submit"
```

Verify S3:

```bash
curl -s "https://<BUCKET_NAME>.s3.<REGION>.amazonaws.com/?list-type=2"
curl -I "https://<BUCKET_NAME>.s3.<REGION>.amazonaws.com/announcement.json"
curl -I "https://<BUCKET_NAME>.s3.<REGION>.amazonaws.com/metadata_latest.json"
```

Public reads should return `200 OK` for existing objects.

## Start automatically after reboot

Create a `systemd` unit that starts Docker Compose at boot:

```ini
[Unit]
Description=Hyperlane Validator Terra Classic
Requires=docker.service
After=docker.service network-online.target
Wants=network-online.target

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/ubuntu/hyperlane/vps
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
```

Enable it:

```bash
sudo systemctl daemon-reload
sudo systemctl enable hyperlane-validator-terraclassic.service
sudo systemctl start hyperlane-validator-terraclassic.service
```

`active (exited)` is expected for this kind of service because `systemd` starts Docker Compose and exits. The long-running process is the Docker container.

## Health check

Example `healthcheck.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

CONTAINER_NAME="${CONTAINER_NAME:-hpl-validator-terraclassic}"
METRICS_URL="${METRICS_URL:-http://127.0.0.1:9121/metrics}"
LOG_WINDOW="${LOG_WINDOW:-10m}"

if ! docker ps --filter "name=^/${CONTAINER_NAME}$" --filter "status=running" --format '{{.Names}}' | grep -qx "${CONTAINER_NAME}"; then
  echo "CRITICAL: ${CONTAINER_NAME} is not running"
  exit 2
fi

if docker logs "${CONTAINER_NAME}" --since "${LOG_WINDOW}" 2>&1 | grep -Eiq "panic|fatal|failed to announce|permission denied|invalid private key|ParsingError"; then
  echo "CRITICAL: recent logs contain an error pattern"
  exit 2
fi

if command -v curl >/dev/null 2>&1; then
  if ! curl -fsS --max-time 5 "${METRICS_URL}" >/dev/null; then
    echo "WARNING: metrics endpoint did not respond at ${METRICS_URL}"
    exit 1
  fi
fi

echo "OK: ${CONTAINER_NAME} is running and no recent critical log pattern was found"
```

Run it every five minutes with cron:

```bash
*/5 * * * * /home/ubuntu/hyperlane/vps/scripts/healthcheck.sh >> /home/ubuntu/hyperlane-healthcheck.log 2>&1
```

## Troubleshooting

### `Expected a valid private key in hex, base58 or bech32`

The `TERRA_PRIVATE_KEY` value is in the wrong format. Verify it without printing the secret:

```bash
source .env
printf "%s\n" "${TERRA_PRIVATE_KEY:0:2}"
printf "%s\n" "${#TERRA_PRIVATE_KEY}"
```

Expected:

```text
0x
66
```

### `account ... not found`

The Terra Classic signer address has not received funds yet. Send a small amount of LUNC to the signer address and restart the container.

### `Failed to announce validator`

Common causes:

- signer address has no LUNC
- RPC endpoint is unavailable
- gas price or gas adjustment is too low
- signer key does not match the expected Terra address

### `Missing base grpcUrls definitions for chain`

Add a valid `grpcUrls` entry to `agent-config.docker.json`.

### `AccessDenied` when listing S3

The bucket is not publicly listable. Hyperlane participants may need to list and read the bucket.

Ensure the bucket policy includes public `s3:ListBucket` for the bucket and public `s3:GetObject` for objects.

## Operational checklist

Before considering the validator live, confirm:

- Docker container is `Up`
- health check returns `OK`
- validator announced its S3 location on-chain
- S3 bucket contains `announcement.json` and `metadata_latest.json`
- public S3 listing works without AWS credentials
- signer address has enough LUNC for future announcements
- `systemd` service is enabled
- secrets are not committed to Git
