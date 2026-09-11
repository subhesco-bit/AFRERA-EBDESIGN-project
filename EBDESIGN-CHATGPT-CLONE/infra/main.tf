terraform {
  required_version = ">= 1.6.0"
}

variable "environment" {
  type    = string
  default = "clone"
}

variable "backend_port" {
  type    = number
  default = 3301
}

locals {
  name = "ebdesign-chatgpt-clone-${var.environment}"
}

output "environment_name" {
  value = local.name
}

output "backend_port" {
  value = var.backend_port
}
