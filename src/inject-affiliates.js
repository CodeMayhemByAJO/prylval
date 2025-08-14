/**
 * Prylval Adtraction Integration
 * Injicerar affiliate-bilder och länkar i produktkort
 */

(function() {
    'use strict';
    
    // Konfiguration
    const CONFIG = {
        AFFILIATE_MAP_URL: '/data/affiliate-map.json',
        CACHE_DURATION: 24 * 60 * 60 * 1000, // 24 timmar
        SELECTORS: {
            PRODUCT_CARDS: '[data-product]',
            PRODUCT_IMAGE: 'img',
            PRODUCT_BUTTON: '.btn-primary, .pick-btn, .card-btn',
            PRODUCT_NAME: '.pick-name, h3, .product-title'
        }
    };
    
    // Global affiliate map (tillgänglig för debugging)
    window.__affiliateMap = null;
    
    // Cache management
    const AffiliateCache = {
        data: null,
        lastUpdated: null,
        
        isValid() {
            return this.data && this.lastUpdated && 
                   (Date.now() - this.lastUpdated) < CONFIG.CACHE_DURATION;
        },
        
        set(data) {
            this.data = data;
            this.lastUpdated = Date.now();
            console.log('📦 Affiliate data cachad:', Object.keys(data).filter(k => !k.startsWith('_')).length, 'produkter');
        },
        
        get() {
            return this.data;
        }
    };
    
    // Namnnormalisering (samma som i backend)
    function normalizeName(str) {
        if (!str) return '';
        
        return str
            .toLowerCase()
            .trim()
            // Ersätt svenska tecken
            .replace(/å/g, 'a')
            .replace(/ä/g, 'a')
            .replace(/ö/g, 'o')
            // Ta bort onödiga suffix
            .replace(/\s*\([^)]*\)/g, '') // (2023), (EU), etc.
            .replace(/\s*(se|eu|uk|us)\b/gi, '')
            .replace(/\s*\d{4}\b/g, '') // År
            // Ta bort duplicerade varumärken
            .replace(/\b(\w+)\s+\1\b/gi, '$1')
            // Komprimera whitespace
            .replace(/\s+/g, ' ')
            .trim();
    }
    
    // Hämta affiliate data
    async function fetchAffiliateData() {
        try {
            console.log('📡 Hämtar affiliate data från:', CONFIG.AFFILIATE_MAP_URL);
            
            const response = await fetch(CONFIG.AFFILIATE_MAP_URL, {
                cache: 'reload', // Ignorera cache en gång per dygn
                headers: {
                    'Cache-Control': 'no-cache'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            // Validera data
            if (!data || typeof data !== 'object') {
                throw new Error('Ogiltig JSON-data');
            }
            
            // Filtrera bort metadata
            const products = {};
            for (const [key, value] of Object.entries(data)) {
                if (!key.startsWith('_') && value && value.tracking_url && value.image_url) {
                    products[key] = value;
                }
            }
            
            console.log(`✅ Hämtade ${Object.keys(products).length} giltiga affiliate-produkter`);
            return products;
            
        } catch (error) {
            console.error('❌ Kunde inte hämta affiliate data:', error.message);
            return null;
        }
    }
    
    // Hitta produktkort på sidan
    function findProductCards() {
        const cards = document.querySelectorAll(CONFIG.SELECTORS.PRODUCT_CARDS);
        console.log(`🔍 Hittade ${cards.length} produktkort med data-product attribut`);
        return cards;
    }
    
    // Skapa eller uppdatera produktbild
    function updateProductImage(imgElement, imageUrl, productName) {
        if (!imgElement || !imageUrl) return;
        
        try {
            // Kontrollera om bilden redan är en affiliate-bild
            if (imgElement.dataset.affiliateImage === imageUrl) {
                return; // Redan uppdaterad
            }
            
            // Skapa picture element med AVIF support
            const picture = document.createElement('picture');
            
            // AVIF source om URL:en redan är AVIF
            if (imageUrl.toLowerCase().includes('.avif')) {
                const avifSource = document.createElement('source');
                avifSource.srcset = imageUrl;
                avifSource.type = 'image/avif';
                picture.appendChild(avifSource);
            } else {
                // Lägg till lokal AVIF om den finns
                const localAvif = imgElement.src.replace(/\.(jpg|jpeg|png)/i, '.avif');
                if (localAvif !== imgElement.src) {
                    const avifSource = document.createElement('source');
                    avifSource.srcset = localAvif;
                    avifSource.type = 'image/avif';
                    picture.appendChild(avifSource);
                }
            }
            
            // Huvudbild (behåll befintlig alt-text)
            const newImg = document.createElement('img');
            newImg.src = imageUrl;
            newImg.alt = imgElement.alt || productName;
            newImg.width = imgElement.width || 400;
            newImg.height = imgElement.height || 200;
            newImg.loading = 'lazy';
            newImg.decoding = 'async';
            newImg.dataset.affiliateImage = imageUrl;
            
            picture.appendChild(newImg);
            
            // Ersätt befintlig img med picture
            imgElement.parentNode.replaceChild(picture, imgElement);
            
            console.log(`🖼️ Uppdaterade bild för ${productName} med affiliate-URL`);
            
        } catch (error) {
            console.error(`❌ Fel vid uppdatering av bild för ${productName}:`, error);
        }
    }
    
    // Skapa eller uppdatera affiliate-knapp
    function updateAffiliateButton(buttonElement, trackingUrl, productName) {
        if (!buttonElement || !trackingUrl) return;
        
        try {
            // Kontrollera om knappen redan är uppdaterad
            if (buttonElement.dataset.affiliateButton === trackingUrl) {
                return; // Redan uppdaterad
            }
            
            // Uppdatera href
            buttonElement.href = trackingUrl;
            
            // Lägg till affiliate-attribut
            buttonElement.rel = 'sponsored nofollow noopener';
            buttonElement.target = '_blank';
            
            // Markera som affiliate
            buttonElement.dataset.affiliateButton = trackingUrl;
            buttonElement.classList.add('is-affiliate');
            
            // Lägg till aria-label om den inte finns
            if (!buttonElement.getAttribute('aria-label')) {
                buttonElement.setAttribute('aria-label', `Se ${productName} hos butik (annonslänk)`);
            }
            
            console.log(`🔗 Uppdaterade knapp för ${productName} med affiliate-URL`);
            
        } catch (error) {
            console.error(`❌ Fel vid uppdatering av knapp för ${productName}:`, error);
        }
    }
    
    // Skapa affiliate-knapp om den inte finns
    function createAffiliateButton(container, trackingUrl, productName) {
        if (!container || !trackingUrl) return;
        
        try {
            // Kolla om det redan finns en affiliate-knapp
            const existingButton = container.querySelector('[data-affiliate-button]');
            if (existingButton) return;
            
            // Skapa ny knapp
            const button = document.createElement('a');
            button.href = trackingUrl;
            button.className = 'btn btn-primary affiliate-btn';
            button.textContent = 'Se hos butik';
            button.rel = 'sponsored nofollow noopener';
            button.target = '_blank';
            button.dataset.affiliateButton = trackingUrl;
            button.classList.add('is-affiliate');
            button.setAttribute('aria-label', `Se ${productName} hos butik (annonslänk)`);
            
            // Lägg till i container
            container.appendChild(button);
            
            console.log(`➕ Skapade affiliate-knapp för ${productName}`);
            
        } catch (error) {
            console.error(`❌ Fel vid skapande av affiliate-knapp för ${productName}:`, error);
        }
    }
    
    // Uppdatera ett produktkort
    function updateProductCard(card, affiliateData) {
        if (!card || !affiliateData) return;
        
        const productName = card.dataset.product;
        if (!productName) return;
        
        try {
            // Normalisera produktnamn för matchning
            const normalizedName = normalizeName(productName);
            
            // Hitta affiliate-data
            const affiliate = affiliateData[normalizedName];
            if (!affiliate) {
                console.log(`ℹ️ Ingen affiliate-data hittad för: ${productName}`);
                return;
            }
            
            console.log(`🎯 Matchade ${productName} med ${affiliate.merchant} (${affiliate.matched_on})`);
            
            // Uppdatera bild
            const imgElement = card.querySelector(CONFIG.SELECTORS.PRODUCT_IMAGE);
            if (imgElement) {
                updateProductImage(imgElement, affiliate.image_url, productName);
            }
            
            // Uppdatera eller skapa affiliate-knapp
            const buttonElement = card.querySelector(CONFIG.SELECTORS.PRODUCT_BUTTON);
            if (buttonElement) {
                updateAffiliateButton(buttonElement, affiliate.tracking_url, productName);
            } else {
                // Skapa ny knapp om ingen finns
                const buttonContainer = card.querySelector('.card-footer, .pick-footer, .product-footer') || card;
                createAffiliateButton(buttonContainer, affiliate.tracking_url, productName);
            }
            
        } catch (error) {
            console.error(`❌ Fel vid uppdatering av produktkort för ${productName}:`, error);
        }
    }
    
    // Huvudfunktion för att injicera affiliate-data
    async function injectAffiliates() {
        try {
            console.log('🚀 Startar affiliate-injection...');
            
            // Hämta affiliate-data (från cache eller nätverk)
            let affiliateData = AffiliateCache.get();
            
            if (!AffiliateCache.isValid()) {
                affiliateData = await fetchAffiliateData();
                if (affiliateData) {
                    AffiliateCache.set(affiliateData);
                }
            }
            
            if (!affiliateData) {
                console.warn('⚠️ Ingen affiliate-data tillgänglig');
                return;
            }
            
            // Exponera för debugging
            window.__affiliateMap = affiliateData;
            
            // Hitta alla produktkort
            const productCards = findProductCards();
            
            if (productCards.length === 0) {
                console.log('ℹ️ Inga produktkort hittade på denna sida');
                return;
            }
            
            // Uppdatera varje kort
            let updatedCount = 0;
            for (const card of productCards) {
                updateProductCard(card, affiliateData);
                updatedCount++;
            }
            
            console.log(`✅ Slutförde affiliate-injection: ${updatedCount} kort uppdaterade`);
            
        } catch (error) {
            console.error('❌ Fel vid affiliate-injection:', error);
        }
    }
    
    // Kör när DOM är redo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectAffiliates);
    } else {
        injectAffiliates();
    }
    
    // Exponera funktioner för debugging
    window.PrylvalAffiliates = {
        inject: injectAffiliates,
        normalizeName: normalizeName,
        getAffiliateMap: () => AffiliateCache.get()
    };
    
})();
