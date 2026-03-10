output "ecr_repository_url" {
  value = aws_ecr_repository.app_repo.repository_url
}


output "rds_endpoint" {
  value = aws_db_instance.postgres.endpoint
}


output "github_actions_role_arn" {
  value = aws_iam_role.github_actions_role.arn
}