# Güvenlik Analizi Raporu: API Anahtarları ve Gizli Bilgiler

**Tarih:** 08.06.2026  
**Proje:** Money-Saver

---

## 1. Tespit Edilen Kritik Güvenlik Açıkları

### 1.1. Hardcoded Turso Veritabanı Auth Token (KRİTİK)

**Dosyalar:**
- `api/db.js` (satır 6)
- `init-db.js` (satır 5)

Her iki dosyada da Turso veritabanına ait bir JWT auth token doğrudan koda gömülmüş durumda:

```js
authToken: process.env.TURSO_AUTH_TOKEN || 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9...'
```

**Risk:** Bu token repoda açıkça görünüyor. Token yetkili bir üçüncü şahıs tarafından kullanılırsa veritabanına tam erişim sağlanabilir. `init-db.js` dosyasında bu token **hiç environment variable kullanılmadan direkt gömülmüş**.

### 1.2. Hardcoded Zayıf JWT Secret (YÜKSEK)

**Dosyalar:**
- `api/db.js` (satır 20)
- `api/auth.js` (satır 6)

```js
const JWT_SECRET = process.env.JWT_SECRET || '<YOUR_JWT_SECRET>';
```

**Risk:** Kullanıcı kimlik doğrulaması için kullanılan JWT secret'ı basit ve herkese açık bir değer (`<YOUR_JWT_SECRET>`). Bu sayede herhangi biri geçerli bir JWT token üretebilir ve herhangi bir kullanıcının hesabına erişebilir.

---

## 2. .env Dosyası ve Gizli Değişken Altyapısı

| Durum | Detay |
|-------|-------|
| `.env` dosyası | ❌ **Yok** |
| `.gitignore`'da `.env` | ❌ **Eksik** (sadece `*.local` var) |
| `.env.example` | ❌ **Yok** |
| `process.env` kullanımı | ⚠️ Kısmen var ama fallback değerler riskli |

---

## 3. Doğru Olan Uygulamalar

- **Frontend JWT Token Yönetimi:** `src/lib/api.ts` içinde token localStorage'da saklanıyor ve Bearer header ile API'ye iletilmesi doğru implemente edilmiş.
- **CORS ve Authorization Header:** Tüm backend API dosyalarında `Authorization` header'ı doğru şekilde kabul ediliyor.
- **bcrypt Şifreleme:** Kullanıcı şifreleri `bcryptjs` ile hash'leniyor, düz metin olarak saklanmıyor.
- **Database URL:** Bir miktar fallback olsa da `process.env.TURSO_DATABASE_URL` kullanılıyor.

---

## 4. Önerilen Düzeltmeler

| # | Dosya | Satır | Sorun | Düzeltme |
|---|-------|-------|-------|----------|
| 1 | `api/db.js` | 6 | Hardcoded Turso auth token | Fallback token'ı kaldır, sadece `process.env.TURSO_AUTH_TOKEN` kullan |
| 2 | `init-db.js` | 5 | Hardcoded Turso auth token (env var yok) | `process.env.TURSO_AUTH_TOKEN` kullan, `.env.example` oluştur |
| 3 | `api/db.js` | 20 | Zayıf JWT secret fallback | Fallback'i kaldır, env var olmadan hata fırlat |
| 4 | `api/auth.js` | 6 | Zayıf JWT secret fallback | Fallback'i kaldır, env var olmadan hata fırlat |
| 5 | `.gitignore` | - | `.env` pattern'i eksik | `.env` satırı ekle |
| 6 | Kök dizin | - | `.env` dosyası yok | `.env.example` oluştur |

---

## 5. Yapılması Gereken Acil İşlemler

1. **ACİL:** `api/db.js` ve `init-db.js`'den hardcoded Turso token'larını kaldır
2. **ACİL:** `api/db.js` ve `api/auth.js`'den zayıf JWT secret fallback'leri kaldır
3. `.gitignore`'a `.env` ekle
4. `.env.example` dosyası oluştur (gerekli değişkenler: `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, `JWT_SECRET`)
5. Mevcut hardcoded token'ları ve secret'ları geçersiz kıl (Turso tarafında token rotate, yeni güçlü JWT secret oluştur)
6. Token'ları sızdırılmış kabul et ve hemen rotate et

---

## 6. Özet

**Projede harici bir API anahtarı (örn. Finviz, Alpha Vantage, vb.) entegrasyonu bulunmamaktadır.** Ancak projede kullanılan iki kritik gizli bilgi (Turso veritabanı auth token ve JWT secret) doğrudan kaynak koduna gömülmüş durumdadır. Bu durum **yüksek öncelikli bir güvenlik açığı** oluşturmaktadır çünkü repo herkese açık olduğu için bu bilgiler kötü niyetli kişiler tarafından kolayca ele geçirilebilir.