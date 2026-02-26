# Overview

A web application that allows users to upload an image and convert it to "ASCII-ART"
The ASCII-ART is then preview in the browser and the user can also download it.

# How to run

The applications uses docker + kind and helm for local deployment.
Run `make help` for a list of available commands

The simplest way to start it up is to either:

1. Run `make tf-apply`, `make helm-install` and `make helm-forward`
1. Run `./deploy.sh` for full the full deployment workflow.

The web application will then be available at `http://localhost:8080`.
