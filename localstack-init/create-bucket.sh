#!/bin/bash
# Create S3 bucket for receipts
awslocal s3 mb s3://beauty-receipts
echo "Created S3 bucket: beauty-receipts"
