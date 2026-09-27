import os
import time
from dotenv import load_dotenv
from hindsight_client import Hindsight

# Load environment variables
load_dotenv()

HINDSIGHT_API_KEY = os.getenv("HINDSIGHT_API_KEY")
HINDSIGHT_BASE_URL = os.getenv("HINDSIGHT_BASE_URL", "https://api.hindsight.vectorize.io")

print(f"Connecting to Hindsight at {HINDSIGHT_BASE_URL}...")

client = Hindsight(api_key=HINDSIGHT_API_KEY, base_url=HINDSIGHT_BASE_URL)

BANK_ID = "devops-incidents"

synthetic_incidents = [
    {
        "incident_id": "INC-1001",
        "symptoms": "Alert: 502 Bad Gateway spike on public-facing API.",
        "error_log": '2026-09-21 14:32:11 [error] 1234#0: *5678 upstream timed out (110: Connection timed out) while reading response header from upstream, client: 192.168.1.5, server: api.company.com, request: "GET /v1/users HTTP/1.1", upstream: "http://10.0.0.2:8080/v1/users"',
        "root_cause": "Nginx upstream timeout due to backend pods being overwhelmed by a sudden spike in traffic. The default proxy_read_timeout was 60s, which wasn't enough for the degraded backend.",
        "resolution": "Scaled up backend pods from 5 to 15. Temporarily increased Nginx proxy_read_timeout to 120s to prevent immediate dropping of slow requests while autoscaler caught up."
    },
    {
        "incident_id": "INC-1002",
        "symptoms": "Alert: Multiple transactions failing with database errors.",
        "error_log": "sqlalchemy.exc.OperationalError: (psycopg2.errors.DeadlockDetected) deadlock detected. Process 14234 waits for ShareLock on transaction 8923; blocked by process 14235.",
        "root_cause": "Database deadlocks caused by concurrent batch payment processing scripts trying to update the same rows in the 'payments' table in different orders.",
        "resolution": "Updated the batch processing job to sort the payment records by ID before executing the bulk update. This ensures all concurrent jobs acquire locks in the same sequence, preventing circular deadlocks."
    },
    {
        "incident_id": "INC-1003",
        "symptoms": "Alert: Pod restarts in 'image-processor' deployment. High latency.",
        "error_log": "Reason: OOMKilled. Exit Code: 137. Last State: Terminated.",
        "root_cause": "Memory leak in the new v2.4.1 image processing library which doesn't release memory buffers after processing large TIFF files.",
        "resolution": "Immediately rolled back deployment to v2.4.0. Increased pod memory limits by 512MB as a temporary buffer. Created Jira ticket to patch the memory leak in v2.4.1."
    },
    {
        "incident_id": "INC-1004",
        "symptoms": "Alert: Redis connection timeouts affecting the caching layer.",
        "error_log": "redis.exceptions.TimeoutError: Timeout reading from socket. (ConnectTimeout)",
        "root_cause": "Connection pool exhaustion. A background analytics job was opening Redis connections but failing to close them in the exception block.",
        "resolution": "Restarted the background job workers to flush dangling connections. Pushed a hotfix to use a context manager (with redis.Redis(...) as r:) to ensure connections are always closed."
    },
    {
        "incident_id": "INC-1005",
        "symptoms": "Alert: CPU utilization on web servers constantly at 100%.",
        "error_log": "top shows process 'node' consuming 99% CPU continuously. Strace shows unusual network connections to mining domains.",
        "root_cause": "Cryptojacking malware disguised as an obfuscated dependency in a newly added npm package ('color-formatter-utils').",
        "resolution": "Isolated infected instances. Removed the compromised dependency from package.json and pushed to production. Rotated all AWS and database credentials that might have been exposed."
    },
    {
        "incident_id": "INC-1006",
        "symptoms": "Alert: CrashLoopBackOff in 'payment-gateway' pods.",
        "error_log": "Error: configmap 'payment-secrets' not found. Pod initialization failed.",
        "root_cause": "A recent Helm chart update accidentally removed the 'payment-secrets' ConfigMap definition, causing pods to fail startup.",
        "resolution": "Reverted the Helm chart to the previous working version. Manually recreated the ConfigMap in the cluster to allow pods to start."
    },
    {
        "incident_id": "INC-1007",
        "symptoms": "Alert: Intermittent SSL handshake failures on public LB.",
        "error_log": "curl: (35) error:14094410:SSL routines:ssl3_read_bytes:sslv3 alert handshake failure",
        "root_cause": "The automated Let's Encrypt certificate renewal cron job failed silently 3 days ago, and the certificate on one of the load balancers expired.",
        "resolution": "Manually ran Certbot to renew the certificate and reloaded the Nginx load balancers. Added monitoring alerts for certificate expiry < 7 days."
    },
    {
        "incident_id": "INC-1008",
        "symptoms": "Alert: High failure rate in 'order-service' calling 'inventory-service'.",
        "error_log": "java.net.UnknownHostException: inventory-service.default.svc.cluster.local",
        "root_cause": "CoreDNS pods were overwhelmed due to a misconfigured service doing aggressive polling, leading to dropped DNS queries.",
        "resolution": "Scaled up CoreDNS deployment from 2 to 6 replicas. Identified the offending service ('analytics-poller') and deployed a fix with exponential backoff."
    },
    {
        "incident_id": "INC-1009",
        "symptoms": "Alert: 'auth-service' nodes are unresponsive and failing health checks.",
        "error_log": "No space left on device. Cannot write to /var/log/auth-service/app.log",
        "root_cause": "Debug logging was accidentally left enabled in production, rapidly filling up the 20GB disk volume with log files.",
        "resolution": "Truncated the log files to free up space immediately (`> app.log`). Changed the logging level to WARN in the configuration and restarted the service."
    },
    {
        "incident_id": "INC-1010",
        "symptoms": "Alert: Severe delay in order confirmation emails.",
        "error_log": "WARN: Kafka consumer lag is 500,000 for topic 'order-events'. Consumer group 'email-sender' is falling behind.",
        "root_cause": "A third-party email API was experiencing high latency, slowing down the processing of each Kafka message in the 'email-sender' consumer.",
        "resolution": "Temporarily switched the email provider to the backup SMTP relay. Increased the number of Kafka partitions for 'order-events' and scaled consumers from 5 to 20."
    },
    {
        "incident_id": "INC-1011",
        "symptoms": "Alert: Database write timeouts in the user registration flow.",
        "error_log": "pymongo.errors.NotPrimaryError: node is not primary. Write operation failed on server db-node-2:27017.",
        "root_cause": "Network partition between MongoDB nodes triggered a replica set election, leaving the cluster without a primary for 15 seconds.",
        "resolution": "The election completed automatically and write availability was restored. We adjusted the `electionTimeoutMillis` to be slightly higher to prevent elections from brief network blips."
    },
    {
        "incident_id": "INC-1012",
        "symptoms": "Alert: Checkout failures. 'Stripe API Error'.",
        "error_log": "StripeRateLimitError: Request limit exceeded. Too many requests to the Stripe API.",
        "root_cause": "A rogue script in the billing service was retrying failed payments in a tight loop without any backoff, hitting Stripe's rate limits.",
        "resolution": "Hotfixed the billing script to implement exponential backoff with jitter on failed payment retries. Cleared the queue of stuck payment jobs."
    },
    {
        "incident_id": "INC-1013",
        "symptoms": "Alert: Node.js service rejecting all new connections.",
        "error_log": "Error: EMFILE, too many open files",
        "root_cause": "The OS file descriptor limit (ulimit -n) was left at the default 1024, which is insufficient for the high-concurrency websocket server.",
        "resolution": "Updated the Dockerfile to set `ulimit -n 65536`. Restarted the containers with the new limits applied."
    },
    {
        "incident_id": "INC-1014",
        "symptoms": "Alert: Search functionality is completely down.",
        "error_log": "ClusterBlockException[blocked by: [SERVICE_UNAVAILABLE/1/state not recovered / initialized];]",
        "root_cause": "An Elasticsearch data node ran out of disk space and left the cluster, causing several primary shards to become unassigned.",
        "resolution": "Expanded the EBS volume size for the affected node. Forced shard reallocation and waited for the cluster state to return to green."
    },
    {
        "incident_id": "INC-1015",
        "symptoms": "Alert: All users are getting 401 Unauthorized errors.",
        "error_log": "JsonWebTokenError: invalid signature",
        "root_cause": "The JWT signing secret was rotated in the database, but the caching layer in the API gateway was still holding the old secret.",
        "resolution": "Flushed the API gateway cache to force it to pull the new JWT secret from the database. Users had to re-login."
    },
    {
        "incident_id": "INC-1016",
        "symptoms": "Alert: High CPU and latency on the 'recommendation-engine'.",
        "error_log": "java.lang.OutOfMemoryError: GC overhead limit exceeded",
        "root_cause": "The service was loading too many large user profile objects into memory at once during the nightly batch job, causing Garbage Collection thrashing.",
        "resolution": "Modified the batch job to process user profiles in chunks of 100 instead of 10,000. Tuned JVM parameters to increase the heap size (-Xmx8G)."
    },
    {
        "incident_id": "INC-1017",
        "symptoms": "Alert: Users cannot upload profile pictures.",
        "error_log": "AccessDenied: Access Denied when calling the PutObject operation on S3 bucket 'user-uploads'",
        "root_cause": "A recent Terraform deployment mistakenly overwrote the IAM role policy attached to the backend service, removing S3 write permissions.",
        "resolution": "Manually re-added the `s3:PutObject` permission to the IAM role in the AWS console. Opened a PR to fix the Terraform configuration."
    },
    {
        "incident_id": "INC-1018",
        "symptoms": "Alert: Internal server errors when generating reports.",
        "error_log": "io.grpc.StatusRuntimeException: DEADLINE_EXCEEDED: deadline exceeded after 4999ms",
        "root_cause": "The 'report-generator' service was hitting the 5-second gRPC deadline when querying the 'data-warehouse' service for very large datasets.",
        "resolution": "Increased the gRPC deadline to 30 seconds for report generation requests. Added pagination to the data warehouse query."
    },
    {
        "incident_id": "INC-1019",
        "symptoms": "Alert: CI/CD pipeline for 'frontend' has been stuck for 2 hours.",
        "error_log": "Error acquiring the state lock: ConditionalCheckFailedException: The conditional request failed",
        "root_cause": "A previous Terraform apply job was cancelled mid-execution, leaving a stale lock in the DynamoDB state locking table.",
        "resolution": "Manually removed the stale lock entry from the DynamoDB table using the AWS CLI (`terraform force-unlock`). Restarted the CI/CD pipeline."
    },
    {
        "incident_id": "INC-1020",
        "symptoms": "Alert: Production web servers dropping out of the target group.",
        "error_log": "Health checks failed: HTTP Code 404 on /healthz",
        "root_cause": "A developer renamed the health check endpoint from `/healthz` to `/api/health` in the application code, but the AWS ALB configuration was not updated.",
        "resolution": "Updated the ALB target group health check configuration to point to the new `/api/health` endpoint. Instances registered successfully."
    }
]

print(f"Storing {len(synthetic_incidents)} incidents into bank: {BANK_ID}")

for incident in synthetic_incidents:
    content = f"""
Incident ID: {incident['incident_id']}
Symptoms: {incident['symptoms']}
Error Log: {incident['error_log']}
Root Cause: {incident['root_cause']}
Resolution: {incident['resolution']}
    """.strip()
    
    print(f"Retaining {incident['incident_id']}...")
    try:
        client.retain(bank_id=BANK_ID, content=content)
        time.sleep(1) # Give it a second to process
    except Exception as e:
        print(f"Failed to retain {incident['incident_id']}: {e}")

print("Done! The agent now has a memory of past incidents.")
