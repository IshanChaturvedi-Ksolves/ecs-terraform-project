Step 1
# ECS Deployment using Terraform

## Objective

Deploy a containerized Node.js application on AWS ECS using Terraform.

The infrastructure includes:
- Custom VPC
- Public and Private Subnets (2 AZs)
- Internet Gateway
- NAT Gateway
- Security Groups
- Amazon RDS (PostgreSQL)
- Amazon ECR
- Amazon ECS (Fargate)
- Application Load Balancer

The application will be accessible through the ALB DNS endpoint.


STEP 2

## Application Details

A simple Node.js Express application is created with:

Endpoints:
- GET / → Basic response
- GET /health → Health check endpoint
- GET /db → Verifies PostgreSQL database connection

Environment variables required:
- DB_HOST
- DB_USER
- DB_PASSWORD
- DB_NAME
- DB_PORT
- PORT



Step 3 
## Running Application Locally

1. Navigate to app directory:
   cd app

2. Install dependencies:
   npm install

3. Start the application:
   node index.js

4. Access endpoints:
   http://localhost:3000/
   http://localhost:3000/health


Step 4 
## Dockerizing the Application

Dockerfile created using Node 18 Alpine base image.

Steps:
- Copy package.json
- Install dependencies
- Copy source code
- Expose port 3000
- Start using node index.js


Step 5 
## Build and Run Docker Locally

1. Build image:
   docker build -t my-node-app .

2. Run container:
   docker run -p 3000:3000 my-node-app

3. Access:
   http://localhost:3000/
   http://localhost:3000/health


Step 6 
## Terraform Initialization

Terraform is configured to use AWS provider in region ap-south-1.

Provider block added in main.tf.


Step 7 
## Creating Amazon ECR Repository

Terraform resource added to create an ECR repository named `ecs-node-app`.

Image scanning on push is enabled.


Step 8 
## Terraform Apply – ECR Created

Terraform successfully created:

- ECR Repository: ecs-node-app

Command used:
terraform apply

Verification:
Repository confirmed in AWS Console under ECR.



Step 9 
## Pushing Docker Image to Amazon ECR

1. Logged into ECR:

aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.ap-south-1.amazonaws.com

2. Tagged local image:

docker tag my-node-app:latest <account-id>.dkr.ecr.ap-south-1.amazonaws.com/ecs-node-app:latest

3. Pushed image:

docker push <account-id>.dkr.ecr.ap-south-1.amazonaws.com/ecs-node-app:latest

Verification:
Image with tag `latest` confirmed in AWS Console under ECR.



Step 10 
## Creating VPC

A custom VPC was created with:

- CIDR block: 10.0.0.0/16
- DNS support enabled
- DNS hostnames enabled

This VPC will host all networking components including subnets, ECS, RDS, and ALB.



Step 11 
## Creating Public Subnet (AZ-1)

A public subnet was created with:

- CIDR: 10.0.1.0/24
- Availability Zone: ap-south-1a
- Auto-assign public IP enabled

This subnet will host public-facing resources such as the Application Load Balancer.


Step 12 
## Creating Public Subnet (AZ-2)

A second public subnet was created with:

- CIDR: 10.0.2.0/24
- Availability Zone: ap-south-1b
- Auto-assign public IP enabled

This ensures high availability for the Application Load Balancer.



Step 13 
## Creating Private Subnet (AZ-1)

A private subnet was created with:

- CIDR: 10.0.3.0/24
- Availability Zone: ap-south-1a

This subnet will host ECS tasks and RDS database instances.


## Creating Private Subnet (AZ-2)

A second private subnet was created with:

- CIDR: 10.0.4.0/24
- Availability Zone: ap-south-1b

This ensures high availability for ECS and RDS.




Step 14
## Creating Internet Gateway

An Internet Gateway was attached to the VPC to allow public subnets to communicate with the internet.

This is required for:
- Application Load Balancer
- NAT Gateway



Step 15 
## Creating Public Route Table

A route table was created for public subnets with:

- Route: 0.0.0.0/0 → Internet Gateway

This enables internet access for public subnets.


Step 16 
## Associating Public Route Table (Subnet 1)

The public route table was associated with the first public subnet.

Step 17
## Associating Public Route Table (Subnet 2)

The public route table was associated with the second public subnet.

Now both public subnets have internet access.


Step 18 
## Creating Elastic IP for NAT Gateway

An Elastic IP was created to assign a public static IP to the NAT Gateway.

This allows private subnets to access the internet securely.


Step 19
## Creating NAT Gateway

A NAT Gateway was created inside Public Subnet 1 using the allocated Elastic IP.

This allows private subnets to access the internet without being directly exposed.


Step 20
## Creating Private Route Table

A private route table was created with:

- Route: 0.0.0.0/0 → NAT Gateway

This allows private subnets to access the internet securely via NAT.


Step 21 
## Associating Private Route Table (Subnet 1)

The private route table was associated with Private Subnet 1.

Step 22
## Associating Private Route Table (Subnet 2)

The private route table was associated with Private Subnet 2.

Now both private subnets can access the internet through the NAT Gateway.


Step 23 
## ALB Security Group

Created a security group for the Application Load Balancer:

- Inbound: HTTP (80) from 0.0.0.0/0
- Outbound: Allow all traffic

Step 24 
## ECS Security Group

Created a security group for ECS tasks:

- Inbound: Port 3000 from ALB security group only
- Outbound: Allow all traffic

Step 25 
## RDS Security Group

Created a security group for RDS:

- Inbound: PostgreSQL (5432) from ECS security group only
- Outbound: Allow all traffic

This ensures the database is not publicly accessible.


Step 26
## RDS Subnet Group

Created a DB Subnet Group using:

- Private Subnet 1
- Private Subnet 2

This ensures the RDS instance is deployed inside private subnets only.



Step 27 
## Creating PostgreSQL RDS Instance

RDS instance configuration:

- Engine: PostgreSQL
- Instance type: db.t3.micro
- Storage: 20 GB
- Database name: appdb
- Public accessibility: Disabled
- Multi-AZ: Disabled (cost optimized)

The database is deployed inside private subnets.



Step 28 
## Creating ECS Cluster

An ECS cluster named `ecs-node-cluster` was created.

This cluster will host the Fargate service for running containerized tasks.

Step 29 
## ECS Task Execution Role

Created an IAM role allowing ECS tasks to assume the role.

This role will allow:
- Pulling images from ECR
- Writing logs to CloudWatch


Step 30 
## Attaching Execution Policy

Attached AWS managed policy:

AmazonECSTaskExecutionRolePolicy

This allows ECS tasks to:
- Pull images from ECR
- Write logs to CloudWatch

Step 31 
## CloudWatch Log Group

Created a log group for ECS container logs:

/ecs/ecs-node-app

Logs will be retained for 7 days.


Step 32 
## ECS Task Definition

Created a Fargate task definition with:

- CPU: 256
- Memory: 512
- Image: ECR repository image
- Container Port: 3000
- Environment variables for DB connection
- CloudWatch logging enabled

Step 33
## Target Group

Created a target group for ECS service:

- Protocol: HTTP
- Port: 3000
- Health check path: /health
- Target type: IP (required for Fargate)

Step 34 
## Application Load Balancer

Created an internet-facing ALB:

- Type: Application
- Public subnets (2 AZs)
- Security Group: ALB SG


Step 35 
## ALB Listener

Created a listener on port 80.

All incoming HTTP traffic is forwarded to the ECS target group.



Step 36 
## ECS Service

Created an ECS Fargate service:

- Desired count: 1
- Runs in private subnets
- Uses ECS security group
- Connected to ALB target group
- No public IP assigned