output "ecr_repository_url" {
  value = aws_ecr_repository.app_repo.repository_url
}


output "rds_endpoint" {
  value = aws_db_instance.postgres.endpoint
}

output "alb_url" {
  value = aws_lb.app_alb.dns_name
}