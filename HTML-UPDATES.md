# HTML-uppdateringar för Adtraction Integration

Detta dokument visar exakt vilka `data-product` attribut som ska läggas till i dina HTML-sidor.

## 📋 Senaste jämförelser (index.html)

Lägg till `data-product` på alla `<article class="card">` element:

```html
<!-- Robotdammsugare -->
<article class="card" data-product="Robotdammsugare 2025">
  <!-- befintligt innehåll -->
</article>

<!-- Träningsklockor -->
<article class="card" data-product="Träningsklockor 2025">
  <!-- befintligt innehåll -->
</article>

<!-- Hörlurar -->
<article class="card" data-product="Hörlurar 2025">
  <!-- befintligt innehåll -->
</article>

<!-- Mesh WiFi -->
<article class="card" data-product="Mesh WiFi 2025">
  <!-- befintligt innehåll -->
</article>

<!-- Airfryers -->
<article class="card" data-product="Airfryers 2025">
  <!-- befintligt innehåll -->
</article>

<!-- Torktumlare -->
<article class="card" data-product="Torktumlare 2025">
  <!-- befintligt innehåll -->
</article>
```

## 📋 Topplistan (index.html)

Lägg till `data-product` på alla `<article class="card topplistan-card">` element:

```html
<!-- Robotdammsugare -->
<article class="card topplistan-card" data-product="iRobot Roomba j7+">
  <!-- befintligt innehåll -->
</article>

<!-- Träningsklockor -->
<article class="card topplistan-card" data-product="Apple Watch Series 9">
  <!-- befintligt innehåll -->
</article>

<!-- Hörlurar -->
<article class="card topplistan-card" data-product="Sony WH-1000XM5">
  <!-- befintligt innehåll -->
</article>

<!-- Mesh WiFi -->
<article class="card topplistan-card" data-product="TP-Link Deco XE75">
  <!-- befintligt innehåll -->
</article>

<!-- Airfryers -->
<article class="card topplistan-card" data-product="Ninja Foodi MAX">
  <!-- befintligt innehåll -->
</article>

<!-- Torktumlare -->
<article class="card topplistan-card" data-product="Samsung DV90T5240AE">
  <!-- befintligt innehåll -->
</article>

<!-- Tvättmaskiner -->
<article class="card topplistan-card" data-product="LG F4WV710P2E">
  <!-- befintligt innehåll -->
</article>
```

## 📋 Kategorisidor

### horlurar-anc.html
```html
<!-- Sony WH-1000XM5 -->
<article class="pick-card" data-product="Sony WH-1000XM5">
  <!-- befintligt innehåll -->
</article>

<!-- Bose QuietComfort Ultra -->
<article class="pick-card" data-product="Bose QuietComfort Ultra">
  <!-- befintligt innehåll -->
</article>

<!-- Apple AirPods Max -->
<article class="pick-card" data-product="Apple AirPods Max">
  <!-- befintligt innehåll -->
</article>
```

### mesh-wifi.html
```html
<!-- TP-Link Deco XE75 -->
<article class="pick-card" data-product="TP-Link Deco XE75">
  <!-- befintligt innehåll -->
</article>

<!-- ASUS ZenWiFi AX (XT8) -->
<article class="pick-card" data-product="ASUS ZenWiFi AX (XT8)">
  <!-- befintligt innehåll -->
</article>

<!-- Netgear Orbi RBK752 -->
<article class="pick-card" data-product="Netgear Orbi RBK752">
  <!-- befintligt innehåll -->
</article>
```

### robotdammsugare.html
```html
<!-- Roborock S8 -->
<article class="pick-card" data-product="Roborock S8">
  <!-- befintligt innehåll -->
</article>

<!-- iRobot Roomba j7+ -->
<article class="pick-card" data-product="iRobot Roomba j7+">
  <!-- befintligt innehåll -->
</article>

<!-- Dreame L10s Ultra -->
<article class="pick-card" data-product="Dreame L10s Ultra">
  <!-- befintligt innehåll -->
</article>
```

### torktumlare.html
```html
<!-- Bosch Serie 6 WTR88T00SN -->
<article class="pick-card" data-product="Bosch Serie 6 WTR88T00SN">
  <!-- befintligt innehåll -->
</article>

<!-- Samsung DV90T5240AE -->
<article class="pick-card" data-product="Samsung DV90T5240AE">
  <!-- befintligt innehåll -->
</article>

<!-- Electrolux EW8H869B -->
<article class="pick-card" data-product="Electrolux EW8H869B">
  <!-- befintligt innehåll -->
</article>
```

### traningsklockor.html
```html
<!-- Apple Watch Series 9 -->
<article class="pick-card" data-product="Apple Watch Series 9">
  <!-- befintligt innehåll -->
</article>

<!-- Garmin Forerunner 265 -->
<article class="pick-card" data-product="Garmin Forerunner 265">
  <!-- befintligt innehåll -->
</article>

<!-- Samsung Galaxy Watch6 -->
<article class="pick-card" data-product="Samsung Galaxy Watch6">
  <!-- befintligt innehåll -->
</article>
```

### tvattmaskiner.html
```html
<!-- Bosch Serie 6 WAN28209SN -->
<article class="pick-card" data-product="Bosch Serie 6 WAN28209SN">
  <!-- befintligt innehåll -->
</article>

<!-- LG F4WV710P2E -->
<article class="pick-card" data-product="LG F4WV710P2E">
  <!-- befintligt innehåll -->
</article>

<!-- Electrolux PerfectCare 700 EW7F5247Q7 -->
<article class="pick-card" data-product="Electrolux PerfectCare 700 EW7F5247Q7">
  <!-- befintligt innehåll -->
</article>
```

### airfryers.html
```html
<!-- Ninja Foodi MAX -->
<article class="pick-card" data-product="Ninja Foodi MAX">
  <!-- befintligt innehåll -->
</article>

<!-- Philips Airfryer XXL -->
<article class="pick-card" data-product="Philips Airfryer XXL">
  <!-- befintligt innehåll -->
</article>

<!-- Cosori Air Fryer -->
<article class="pick-card" data-product="Cosori Air Fryer">
  <!-- befintligt innehåll -->
</article>
```

### dammsugare.html
```html
<!-- Dyson V15 Detect -->
<article class="pick-card" data-product="Dyson V15 Detect">
  <!-- befintligt innehåll -->
</article>

<!-- Miele Triflex -->
<article class="pick-card" data-product="Miele Triflex">
  <!-- befintligt innehåll -->
</article>

<!-- Bosch Unlimited -->
<article class="pick-card" data-product="Bosch Unlimited">
  <!-- befintligt innehåll -->
</article>
```

## 📋 Script-taggar

Lägg till följande `<script>` tag i `<head>` på alla kategorisidor:

```html
<head>
  <!-- befintliga meta-taggar och CSS -->
  
  <!-- Adtraction Integration -->
  <script src="/src/inject-affiliates.js"></script>
</head>
```

## ⚠️ Viktigt

- **Exakta namn**: Använd exakt samma produktnamn som i `data/editorial-products.json`
- **Konsekvent**: Samma produkt ska ha samma namn på alla sidor
- **Inga extra tecken**: Inga extra mellanslag, bindestreck eller specialtecken
- **Testa**: Verifiera att `data-product` attributen fungerar genom att kolla DevTools

## 🔍 Verifiering

Efter att du lagt till alla attribut, öppna DevTools och kolla:

```javascript
// Antal produktkort med data-product
document.querySelectorAll('[data-product]').length

// Affiliate map laddad
window.__affiliateMap

// Affiliate funktioner tillgängliga
window.PrylvalAffiliates
```
