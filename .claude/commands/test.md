Lance les tests pour $ARGUMENTS.

## Comportement
- Si vide : lance tous les tests du projet
- "api" : `cd apps/api && npm test`
- "mobile" : `cd apps/mobile && npm test`
- "admin" : `cd apps/admin && npm test`
- "e2e" : tests end-to-end Playwright
- "coverage" : tests avec rapport de couverture

Affiche un résumé clair des résultats avec les éventuelles erreurs.
