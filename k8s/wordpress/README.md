# Prodavnica — WordPress + WooCommerce

Self-contained WordPress stack served at `https://prodavnica.aleksaristic.com`,
deployed into the existing `ar-web-namespace`.

## Components

| Resource | Purpose |
| --- | --- |
| `mariadb-*` | MariaDB 11.4 database + 5Gi PVC (`Recreate` strategy, RWO volume) |
| `wordpress-*` | WordPress 6 (PHP 8.3 / Apache) + 10Gi PVC for `/var/www/html` |
| `wordpress-ingress` | nginx ingress on `prodavnica.aleksaristic.com`, TLS via the existing wildcard `aleksaristic-tls` secret |

TLS reuses the `aleksaristic-tls` secret already present in `ar-web-namespace`
(the `*.aleksaristic.com` wildcard cert), so no new certificate is required.

## Required GitHub Actions secrets

Add these to the `production` environment before running the workflow:

- `PRODAVNICA_DB_ROOT_PASSWORD` — MariaDB root password
- `PRODAVNICA_DB_PASSWORD` — password for the `wordpress` DB user (shared by MariaDB and WordPress)

(`KUBE_CONFIG_PURE` and `regcred` are already configured for the cluster.)

## Deploy

Run the **"Deploy prodavnica WordPress + WooCommerce to cluster"** workflow
(`workflow_dispatch`) from the Actions tab. It applies the secrets, PVCs,
deployments, services, and ingress, then waits for both rollouts.

To apply manually instead:

```bash
export PRODAVNICA_DB_ROOT_PASSWORD=... PRODAVNICA_DB_PASSWORD=...
envsubst < k8s/wordpress/mariadb-secret.yaml   | kubectl apply -f -
envsubst < k8s/wordpress/wordpress-secret.yaml | kubectl apply -f -
kubectl apply -f k8s/wordpress/mariadb-pvc.yaml -f k8s/wordpress/wordpress-pvc.yaml
kubectl apply -f k8s/wordpress/mariadb-deployment.yaml -f k8s/wordpress/mariadb-service.yaml
kubectl apply -f k8s/wordpress/wordpress-deployment.yaml -f k8s/wordpress/wordpress-service.yaml
kubectl apply -f k8s/wordpress/wordpress-ingress.yaml
```

## Install WooCommerce (one-time, post-deploy)

WooCommerce is a WordPress plugin, not an infra concern. After the stack is up:

1. Visit `https://prodavnica.aleksaristic.com/wp-admin` and complete the WordPress install wizard (admin user, site title).
2. **Plugins → Add New → search "WooCommerce" → Install → Activate.**
3. Follow the WooCommerce setup wizard (store address, currency, payments, shipping).

The plugin and all store data persist on the WordPress PVC and survive pod restarts.
