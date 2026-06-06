FROM traefik:v3.4

# Bake static config
COPY traefik.ecs.yml /etc/traefik/traefik.yml

# Bake dynamic config (shared middlewares)
COPY dynamic/ /etc/traefik/dynamic/

EXPOSE 80
EXPOSE 8080
