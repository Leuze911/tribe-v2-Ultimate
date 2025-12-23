Affiche le status complet de l'environnement TRIBE v2.

## Vérifications
1. Services Docker : `docker compose ps`
2. Santé API : `curl -s localhost:4000/health || echo "API down"`
3. Santé Admin : `curl -s localhost:3001 || echo "Admin down"`
4. PostgreSQL : `docker exec tribe-postgres pg_isready`
5. Redis : `docker exec tribe-redis redis-cli ping`
6. Git status : `git status --short`
7. Derniers commits : `git log --oneline -5`

Formate en tableau clair.
