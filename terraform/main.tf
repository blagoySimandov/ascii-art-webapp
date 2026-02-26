terraform {
  required_version = "~> 1.10.3"
  required_providers {
    kind = {
      source  = "tehcyx/kind"
      version = "~> 0.11.0"
    }
  }
}

locals {
  #dynamically compute node types from the count vars
  nodes = concat(
    [for i in range(var.control_plane_count) : "control-plane"],
    [for i in range(var.worker_count) : "worker"]
  )
}

provider "kind" {}

resource "kind_cluster" "default" {
  name           = var.cluster_name
  node_image     = var.node_image # ?
  wait_for_ready = true

  kind_config {
    kind        = "Cluster"
    api_version = "kind.x-k8s.io/v1alpha4"


    dynamic "node" {
      for_each = local.nodes
      content {
        role = node.value
      }
    }
  }
}

output "cluster_name" {
  value       = kind_cluster.default.name
  description = "Name of the KinD cluster"
}

output "cluster_kubeconfig" {
  value       = kind_cluster.default.kubeconfig
  description = "Kubeconfig for the cluster"
  sensitive   = true
}
