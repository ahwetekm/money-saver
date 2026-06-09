# Silinen İşlemlerin İkincil Cihazla Senkronizasyon Sorunu Çözüm Planı

## Sorun Tanımı

İşlemler sayfasından bir işlem silindiğinde, diğer cihazlar (ikincil cihazlar) bu silme işlemini algılamıyor. Silinmiş veri ikincil cihazlarda hâlâ görünür. Ancak "Tüm verileri sıfırla" işlemi doğru çalışıyor.

## Sorun Analizi

### Mevcut Akış

1. **Birinci Cihaz (Silme İşlemi):**
   - `deleteTransaction(id)` → `offlineApi.deleteTransaction(id)`
   - `writeLocalAndQueue('transactions', 'delete', { id })`
   - `deleteLocal()` → Veriyi `isDeleted: true` olarak işaretler
   - `enqueueSync()` → Sync queue'ye `delete` operasyonu ekler
   - Background sync → Remote'den veriyi siler, queue'dan kaldırır

2. **İkinci Cihaz (Senkronizasyon):**
   - `pullAllFromRemote()` → Remote'den tüm işlemleri çeker
   - `mergeRemoteRecords('transactions', remoteTransactions, now)` → Remote verilerini local ile birleştirir
   - **PROBLEM:** Remote'de olmayan (silinmiş) veriler için `isDeleted` kontrolü yapılmiyor!

### Root Cause

`mergeRemoteRecords()` fonksiyonu (`src/lib/sync.ts:221-239`) sadece remote'deki verileri işler:
- Remote'deki verileri local ile merge eder
- **Ancak:** Remote'de bulunmayan ama local'de `isDeleted: false` olan verileri işleme almıyor
- Bu durumda silinmiş bir kayıt ikincil cihazlarda `isDeleted: true` olarak işaretlenmediği için hâlâ görünür

## Çözüm Stratejisi

### Yaklaşım 1: Remote Kıyaslaması (Önerilen)

Her senkronizasyon sırasında:
1. Remote'den gelen tüm veriler toplanır
2. Local'deki tüm veriler kontrol edilir
3. Remote'de olmayan veriler `isDeleted: true` olarak işaretlenir

### Yaklaşım 2: Soft Delete'leri Sync Queue'ye Eklemek

Silme işlemi sırasında sadece `isDeleted: true` yerine, gerçekten `DELETE` API çağrısı yapılır. Bu zaten mevcut. Ancak ikincil cihazlarda bunun yorumlanması için sync queue'den gelen verilerin de işlenmesi gerekir.

## Teknik Detaylar

### Değiştirilecek Dosyalar

1. **src/lib/sync.ts** - `mergeRemoteRecords` fonksiyonunu genişletmek
2. **src/lib/offlineApi.ts** - `pullAllFromRemote` çağrısını optimize etmek (opsiyonel)

### Uygulama Adımları

#### Adım 1: `mergeRemoteRecords` fonksiyonunu güncelle

```typescript
// Mevcut sorunsuz kısım - sadece eksik olan kısmı ekleyelim
async function mergeRemoteRecords(entity: string, remoteRecords: any[], now: number) {
  const table = entityTables[entity];
  if (!table) return;

  const remoteIds = new Set(remoteRecords.map(r => r.id));
  
  // Yeni: Remote'de olmayan verileri silinmiş olarak işaretle
  const allLocal = await table.toArray();
  for (const local of allLocal) {
    if (!local.isDeleted && !remoteIds.has(local.id)) {
      await table.put({ ...local, isDeleted: true, updatedAt: now });
    }
  }

  // Mevcut kod: Remote verilerini merge et
  for (const remote of remoteRecords) {
    const local = await table.get(remote.id);
    if (local && local.updatedAt && local.syncedAt && local.updatedAt > local.syncedAt) {
      continue;
    }
    await table.put({
      ...(local || {}),
      ...remote,
      updatedAt: now,
      syncedAt: now,
    });
  }
}
```

#### Adım 2: `pullAllFromRemote` içinde sync queue'deki delete'leri işleme al (opsiyonel)

Alternatif olarak, ikincil cihazda `pullAllFromRemote` sırasında sync queue'deki `delete` operasyonlarını da işleyebiliriz:

```typescript
export async function pullAllFromRemote() {
  if (!_isOnline) return;

  // ... mevcut kod ...
  
  // Yeni: Sync queue'deki delete'leri de uygula
  const queue = await db.syncQueue.where('operation').equals('delete').toArray();
  for (const item of queue) {
    const table = entityTables[item.entity];
    if (table) {
      const exists = await table.get(item.payload.id);
      if (exists && !exists.isDeleted) {
        await table.put({ ...exists, isDeleted: true, updatedAt: Date.now() });
      }
    }
  }
}
```

## Açıklama: Neden "Tüm verileri sıfırla" çalışıyor?

`resetUserData()` fonksiyonu (`api/user.js:42-54`) hem local hem de remote'den tüm verileri siler:
- `clearAllLocalData()` → Local veritabanını (tüm tabloları) temizler
- `api.resetUserData()` → Remote'den tüm tablolardaki verileri siler

Bu yüzden "geçerliliğini koruyor" - çünkü her iki yönlü de silme yapılıyor.

## Test Senaryoları

1. **Birinci Cihaz:** İşlem sil
2. **İkinci Cihaz:** Otomatik/manuel senkronizasyon tetikle
3. **Beklenen:** Silinmiş işlem ikinci cihazda da kaybolmalı

4. **Birinci Cihaz:** Tüm verileri sıfırla
5. **İkinci Cihaz:** Senkronizasyon tetikle
6. **Beklenen:** İkinci cihazda da tüm veriler kaybolmalı (bu şu anda çalışıyor)

## Alternatif Çözüm: GÜN Destekli Senkronizasyon

Daha güvenilir bir çözüm için her entity için `userId` alanı ekleyip, sync sırasında kullanıcı bazlı senkronizasyon yapabiliriz. Ancak bu, veritabanı şemasını değiştirmek gerektirir.

## Risk Değerlendirmesi

- **Düşük Risk:** `mergeRemoteRecords` güncellemesi, sadece remote'de olmayan verileri işaretler, mevcut verileri etkilemez
- **Orta Risk:** Sync queue'deki delete'leri işleme almak, duplicate sync'leri tetikleyebilir
- **Düşük Risk:** Test sonrası rollback kolaydır

## Önerilen Öncelik

1. **Önce:** `mergeRemoteRecords` fonksiyonunu güncelle (Adım 1)
2. **Sonra:** Test yap, sorun devam ederse sync queue yaklaşımını ekle (Adım 2)