# Login API Hatası Çözüm Planı

## Hata Analizi

### Ana Hata
- **Konu:** `Failed to execute 'json' on 'Response': Unexpected end of JSON input` + `api/auth:1 404 (Not Found)`
- **Kaynak:** Vite development sunucusu `/api/auth` endpoint'ine yanıt veremiyor

### Kök Nedenler
1. **Vite yapılandırması eksik:** `vite.config.ts` içinde API proxy/middleware yok
2. **API dosyaları çalışır durumda değil:** `api/auth.js` gibi dosyalar Node.js serverless function formatında, tarayıcı için doğrudan erişilemez
3. **JWT_SECRET geçersiz:** `.env` dosyasındaki değer bir JWT token gibi görünüyor, güvenli bir secret key olmalı

## Çözüm Seçenekleri

### Seçenek A: Vite Dev Server API Proxy (Tavsiye Edilen)
Vite config'e API proxy ekle, geliştirme ortamında gerçek bir backend sunucusuna yönlendir.

### Seçenek B: Mock Auth Endpoint (Geliştirme İçin Geçici)
Login.tsx'te API hatası yakalanırsa local mock authentication kullan.

## Uygulama Planı

### Adım 1: JWT_SECRET Düzeltme
- `.env` dosyasındaki `JWT_SECRET` değerini güvenli bir random string ile değiştir

### Adım 2: Vite API Proxy Ekle
`vite.config.ts`'ye middleware ekleyerek `/api/*` isteklerini yerel bir API sunucusuna yönlendir:
- Proxy target: `http://localhost:3001` (ayrı API sunucusu için)

### Adım 3: Login.tsx Güvenlik Düzeltmesi
`response.json()` çağrısında hata yakalama ekle - 404 durumunda boş yanıt dönerse crash olmasın.

## Riskler
- API sunucusunun ayrı bir portta çalışması gerekiyor → geliştirme sürecini karmaşıklaştırabilir
- Alternatif olarak mock auth sadece geliştirme için yeterli olabilir

## Öneri
Geliştirme için yerel bir mock API server oluşturmak veya Vite plugin kullanarak doğrudan JS fonksiyonlarını bundle etmek.