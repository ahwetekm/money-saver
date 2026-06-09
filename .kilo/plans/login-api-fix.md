# Login API Hatası Çözüm Planı

## Hata Analizi

### Geliştirme Hatası
- **Konu:** `Failed to execute 'json' on 'Response': Unexpected end of JSON input` + `api/auth:1 404 (Not Found)`
- **Kaynak:** Vite development sunucusu (`/api/auth`) endpoint'ine yanıt veremiyor
- **Çözüm:** `vercel dev` kullanılıyor, bu doğru yaklaşım

### Production Hatası (Deploy)
- **Konu:** `Unexpected token 'A', "A server e"... is not valid JSON`
- **Kaynak:** Vercel'de `/api/auth` endpoint'inden HTML hata sayfası dönüyor
- **Muhtemel Nedenler:**
  1. `vercel.json` yapılandırması eksik
  2. JWT_SECRET Vercel environment variables'te tanımlı değil
  3. API function'ları Vercel'in beklediği formata uygun değil olabilir
  4. Build output directory yanlış yapılandırılmış

## Uygulama Planı

### Adım 1: vercel.json Oluştur
```json
{
  "version": 2,
  "builds": [
    { "src": "package.json", "use": "@vercel/static-build", "config": { "distDir": "dist" } },
    { "src": "api/*.js", "use": "@vercel/node" }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "/api/$1" }
  ]
}
```

### Adım 2: JWT_SECRET Production Ayarı
- Vercel dashboard'da JWT_SECRET environment variable ekle
- Değer: güvenli random string (mevcut değer bir JWT token, değiştirilmeli)

### Adım 3: vercel-build Script Kontrolü
- `package.json` içinde `"vercel-build": "tsc -b && vite build"` eklenmeli

### Adım 4: Login.tsx Güvenlik Düzeltmesi
`response.json()` öncesi kontrol ekle - boş/hatalı yanıt durumunda crash olmasın.