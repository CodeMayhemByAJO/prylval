# Prylval Adtraction Integration

Automatiserad integration för att hämta affiliate-data från Adtraction och injicera dem i Prylval's produktkort.

## 🚀 Snabbstart

### 1. Installera dependencies
```bash
npm install
```

### 2. Konfigurera Adtraction feeds
Kopiera `config.example` till `.env.local` och uppdatera med dina riktiga feed URLs:

```bash
cp config.example .env.local
```

Redigera `.env.local`:
```env
ATTRACTION_FEED_COMPUTERSALG=https://din-adtraction-konto.com/feed/computersalg-se.json
ATTRACTION_FEED_VALOSTORE=https://din-adtraction-konto.com/feed/valostore-se.json
```

### 3. Hämta affiliate-data
```bash
npm run fetch:affiliates
```

### 4. Lägg till script i HTML-sidor
Lägg till följande i `<head>` på alla kategorisidor:

```html
<script src="/src/inject-affiliates.js"></script>
```

### 5. Lägg till data-product attribut
Lägg till `data-product="Produktnamn"` på alla produktkort:

```html
<article class="pick-card" data-product="Sony WH-1000XM5">
  <!-- produktinnehåll -->
</article>
```

## 📁 Filstruktur

```
prylval/
├── package.json                 # Dependencies och scripts
├── config.example              # Mall för .env.local
├── .env.local                 # Adtraction feed URLs (skapa från config.example)
├── data/
│   ├── editorial-products.json # Redaktionella produktnycklar
│   └── affiliate-map.json     # Genererad affiliate-mappning
├── scripts/
│   └── fetch-affiliates.mjs   # Backend script för datahämtning
└── src/
    └── inject-affiliates.js   # Frontend script för injection
```

## 🔧 Konfiguration

### Adtraction Feed URLs
Hämta från Adtraction UI:
1. Logga in på ditt Adtraction-konto
2. Gå till **Tools → Product feeds → JSON**
3. Kopiera URL:erna för "Computersalg SE" och "Valostore SE"
4. Lägg till i `.env.local`

### Handlarprioritet
- **Valostore**: Prioritet 2 (högre)
- **Computersalg**: Prioritet 1 (lägre)

Vid konflikter väljs handlaren med högre prioritet.

## 📊 Produktmatchning

### Matchningslogik
1. **Exakt match**: Samma normaliserade namn
2. **Contains match**: Min 8 tecken, ena innehåller andra
3. **Levenshtein**: Max 2 skillnader, min 8 tecken

### Namnnormalisering
- Svenska tecken: å→a, ä→a, ö→o
- Ta bort suffix: (2023), SE, EU, etc.
- Ta bort duplicerade varumärken
- Komprimera whitespace

### Match keys
Varje produkt genererar flera match-nycklar:
- `"sony wh-1000xm5"` → `["sony wh 1000xm5", "sonywh1000xm5", "wh1000xm5"]`

## 🎯 HTML-uppdateringar

### Lägg till data-product attribut
På alla produktkort, lägg till `data-product` med exakt produktnamn:

```html
<!-- Senaste jämförelser -->
<article class="card" data-product="Robotdammsugare 2025">

<!-- Topplistan -->
<article class="card topplistan-card" data-product="iRobot Roomba j7+">

<!-- Kategorisidor -->
<article class="pick-card" data-product="Sony WH-1000XM5">
```

### Produktnamn att använda
Se `data/editorial-products.json` för exakta namn som ska användas.

## 🚀 Scripts

### fetch:affiliates
Hämtar Adtraction feeds och genererar affiliate-map.json:
```bash
npm run fetch:affiliates
```

### postbuild
Kopierar affiliate-map.json till public/ (körs automatiskt efter build):
```bash
npm run postbuild
```

## 📈 Coverage och loggar

### Console output
Scriptet loggar:
- Antal produkter per kategori
- Matchningsstatistik per handlare
- Varningar för dubbletter
- Total coverage-procent

### Exempel output
```
📊 COVERAGE RAPPORT
==================

HORLURAR:
  Total: 3 produkter
  Matchade: 2 (66.7%)
  Handlare:
    computersalg: 1 produkter
    valostore: 1 produkter

🎯 TOTAL COVERAGE: 15/24 (62.5%)
```

## 🔍 Debugging

### Frontend debugging
Öppna DevTools och kolla:
```javascript
// Affiliate map
window.__affiliateMap

// Affiliate funktioner
window.PrylvalAffiliates

// Manuell injection
window.PrylvalAffiliates.inject()
```

### Backend debugging
Scriptet loggar detaljerad information om:
- Feed-hämtning
- Produktmatchning
- Validering
- Felhantering

## 🛡️ Säkerhet och robusthet

### Validering
- `tracking_url` måste börja med `https://go.`
- `image_url` måste finnas
- Filtrerar bort ogiltiga produkter

### Felhantering
- Retry med exponential backoff
- Behåller befintlig data vid fel
- Graceful fallback till lokala bilder

### Idempotent
- Skriver endast över om ny data finns
- Behåller tidigare image_url/tracking_url
- Uppdaterar endast vid bättre match

## 🔄 Automatisering

### CI/CD
Lägg till i din build-pipeline:
```yaml
- name: Fetch affiliates
  run: npm run fetch:affiliates

- name: Build
  run: npm run build

- name: Post-build
  run: npm run postbuild
```

### Cron jobs
Kör `fetch:affiliates` regelbundet:
```bash
# Varje dag kl 02:00
0 2 * * * cd /path/to/prylval && npm run fetch:affiliates
```

## 📝 Exempel på affiliate-map.json

```json
{
  "_schema": 1,
  "_updated_at": "2025-01-15T10:30:00.000Z",
  "sony wh 1000xm5": {
    "merchant": "computersalg",
    "tracking_url": "https://go.adtraction.com/...",
    "image_url": "https://example.com/sony-wh1000xm5.jpg",
    "source_product_id": "12345",
    "matched_on": "exact:sony wh 1000xm5",
    "confidence": 1.0,
    "merchant_priority": 1,
    "updated_at": "2025-01-15T10:30:00.000Z"
  }
}
```

## 🆘 Felsökning

### Vanliga problem

**Inga feeds konfigurerade**
```
❌ Inga Adtraction feeds konfigurerade i .env.local
```
Lösning: Skapa `.env.local` från `config.example`

**Feed-hämtning misslyckas**
```
❌ Kunde inte hämta computersalg: HTTP 401: Unauthorized
```
Lösning: Kontrollera feed URL:er och autentisering

**Inga matchningar**
```
ℹ️ Ingen affiliate-data hittad för: Sony WH-1000XM5
```
Lösning: Kontrollera `data-product` attribut och produktnamn

**Bilder laddas inte**
```
❌ Fel vid uppdatering av bild
```
Lösning: Kontrollera `image_url` i feed och CORS-inställningar

## 📞 Support

För frågor om Adtraction-integrationen, kontakta utvecklingsteamet.

---

**Version**: 1.0.0  
**Senast uppdaterad**: 2025-01-15  
**Node-version**: 18+
