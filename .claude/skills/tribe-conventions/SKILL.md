---
name: tribe-conventions
description: Conventions et patterns spécifiques au projet TRIBE. Utilisé automatiquement lors du développement.
---

# TRIBE Conventions

## Couleurs
- Primary : #10B981 (vert)
- Secondary : #3B82F6 (bleu)
- Error : #EF4444 (rouge)
- Warning : #F59E0B (orange)
- Background : #F9FAFB (gris clair)
- Dark Background : #111827

## Catégories de POI
```typescript
enum LocationCategory {
  RESTAURANT = 'restaurant',
  HOTEL = 'hotel',
  PHARMACY = 'pharmacy',
  HOSPITAL = 'hospital',
  BANK = 'bank',
  SCHOOL = 'school',
  MOSQUE = 'mosque',
  CHURCH = 'church',
  SHOP = 'shop',
  GAS_STATION = 'gas_station',
  MARKET = 'market',
  TRANSPORT = 'transport',
  GOVERNMENT = 'government',
  OTHER = 'other'
}
```

## Status de POI
```typescript
enum LocationStatus {
  PENDING = 'pending',
  VALIDATED = 'validated',
  REJECTED = 'rejected'
}
```

## Système de Points
- Base par POI validé : 10 points
- Bonus par photo : +2 points
- Bonus description > 50 chars : +5 points
- Bonus adresse complète : +3 points
- Maximum par POI : 50 points

## Niveaux
| Niveau | Nom | Points Min | Points Max |
|--------|-----|------------|------------|
| 1 | Débutant | 0 | 99 |
| 2 | Explorateur | 100 | 499 |
| 3 | Cartographe | 500 | 1499 |
| 4 | Expert | 1500 | 3999 |
| 5 | Maître | 4000 | 9999 |
| 6 | Ambassadeur | 10000 | ∞ |

## API Endpoints Pattern
```
GET    /api/v1/{resource}          # Liste
GET    /api/v1/{resource}/:id      # Détail
POST   /api/v1/{resource}          # Création
PUT    /api/v1/{resource}/:id      # Mise à jour complète
PATCH  /api/v1/{resource}/:id      # Mise à jour partielle
DELETE /api/v1/{resource}/:id      # Suppression
```

## Réponse API Standard
```typescript
interface ApiResponse<T> {
  data: T;
  meta?: {
    total: number;
    page: number;
    limit: number;
  };
  error?: {
    code: string;
    message: string;
  };
}
```
