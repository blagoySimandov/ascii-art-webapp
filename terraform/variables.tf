variable "cluster_name" {
  description = "Name of the KinD cluster"
  type        = string
  default     = "blagoy-simandoff-cluster-img-ascii"
}

variable "node_image" {
  description = "Docker image for KinD nodes"
  type        = string
  default     = "kindest/node:v1.35.0"
}

variable "control_plane_count" {
  type    = number
  default = 1

  validation {
    condition     = var.control_plane_count > 0
    error_message = "Control plane nodes must be greater than 0."
  }
}

variable "worker_count" {
  type    = number
  default = 3

  validation {
    condition     = var.worker_count > 0 && var.worker_count <= 10
    error_message = "Worker nodes must be between 1 and 10."
  }
}
