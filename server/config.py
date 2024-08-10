import os
from redis import Redis
from rq import Queue
import boto3
from botocore.config import Config
from dotenv import load_dotenv

load_dotenv()

def get_s3_client():
    return boto3.client(
        's3',
        endpoint_url=os.getenv('R2_ENDPOINT_URL'),
        aws_access_key_id=os.getenv('R2_ACCESS_KEY_ID'),
        aws_secret_access_key=os.getenv('R2_SECRET_ACCESS_KEY'),
        config=Config(signature_version='s3v4'),
        region_name='auto'
    )

def get_redis_connection():
    redis_url = os.getenv("REDIS_URL")
    return Redis.from_url(redis_url)

def get_task_queue():
    return Queue(connection=get_redis_connection())

# Shared variables
BUCKET_NAME = os.getenv('R2_BUCKET_NAME')