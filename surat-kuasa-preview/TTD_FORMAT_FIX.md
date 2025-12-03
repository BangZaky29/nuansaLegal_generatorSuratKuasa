# TTD Format & Pagination Upgrade - 100% Sesuai Foto

## Update Terbaru

### 1. ✅ Format TTD 100% Sesuai Foto

**Layout TTD Baru:**
```
                     [Tempat], [Tanggal]

Penerima Kuasa I                        Pemberi Kuasa
_____________________                   _____________________
[Nama Penerima 1]                       [Nama Pemberi]

Penerima Kuasa 2     Penerima Kuasa 3   Penerima Kuasa 4
_________            _________          _________
[Nama]               [Nama]             [Nama]

dst...
```

**Detail TTD:**
- **Top Right**: Tanggal dan Tempat (contoh: "Kabupaten Karawang, 02 Desember 2025")
- **Baris pertama**: "Penerima Kuasa I" (kiri) dan "Pemberi Kuasa" (kanan) - SEJAJAR dengan border atas
- **Baris kedua+**: Penerima Kuasa 2-6 dalam grid 3 kolom dengan border atas masing-masing
- **Border**: Garis tebal 1.5px untuk Penerima I & Pemberi Kuasa, 1px untuk Penerima lainnya

### 2. ✅ Hilangkan Loop "PEMBERI KUASA"

**Perubahan:**
- ~~"Selanjutnya dalam surat kuasa ini disebut sebagai PENERIMA KUASA 1"~~ ❌
- ~~"Selanjutnya dalam surat kuasa ini disebut sebagai PENERIMA KUASA 2"~~ ❌
- ✅ **Hanya 1x**: "Dengan ini memberikan kuasa kepada: Selanjutnya dalam surat kuasa ini disebut sebagai **PENERIMA KUASA**."

**Struktur Baru:**
```
Dengan ini memberikan kuasa kepada:
Selanjutnya dalam surat kuasa ini disebut sebagai PENERIMA KUASA.

(Penerima 1)
[Detail Data Penerima 1]

(Penerima 2)
[Detail Data Penerima 2]

dst...
```

### 3. ✅ Margin untuk Page Break

**Perubahan CSS:**
- `column-gap: 3rem` (ditingkatkan dari 2rem)
- `margin-bottom: 1.5rem` pada `.surat-section`
- `padding-bottom: 0.5rem` untuk spacing tambahan
- `margin-bottom: 2rem` pada `.surat-signature`
- `orphans: 3` & `widows: 3` - minimum 3 lines di awal/akhir page

**Styling Tambahan:**
- `.surat-table` dengan `break-inside: avoid` - tabel tidak terputus
- Page break yang lebih rapi dengan gap yang lebih lebar

## File yang Diubah

### 1. `src/App.jsx`

**Bagian Penerima Kuasa:**
```jsx
// SEBELUM: Loop dengan repetisi text
{penerimaKuasaList.map((penerima, index) => (
  <p>Selanjutnya dalam surat kuasa ini disebut sebagai PENERIMA KUASA {index + 1}</p>
))}

// SESUDAH: Hanya 1x text
<p>Selanjutnya dalam surat kuasa ini disebut sebagai PENERIMA KUASA</p>
{penerimaKuasaList.map((penerima, index) => (
  // Detail tanpa repetisi text
))}
```

**Format TTD Baru:**
```jsx
// Penerima Kuasa I & Pemberi Kuasa - di satu baris sejajar
<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
  <div>
    Penerima Kuasa I
    [Signature Box]
  </div>
  <div>
    Pemberi Kuasa
    [Signature Box]
  </div>
</div>

// Penerima Kuasa 2-6 - grid 3 kolom
{penerimaKuasaList.length > 1 && (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
    {penerimaKuasaList.slice(1).map(...)}
  </div>
)}
```

### 2. `src/App.css`

```css
/* Increased spacing for page breaks */
column-gap: 3rem;

/* Prevent awkward section breaks */
.surat-section {
  margin-bottom: 1.5rem;
  padding-bottom: 0.5rem;
}

.surat-signature {
  margin-bottom: 2rem;
  padding-bottom: 1rem;
}

/* Orphans & Widows rule - minimum 3 lines per page */
orphans: 3;
widows: 3;
```

## Test Checklist

- [ ] **TTD Layout**: Lihat TTD di bawah preview - Penerima I sejajar dengan Pemberi Kuasa
- [ ] **Tanggal Positioning**: Tanggal & Tempat ada di top right
- [ ] **Penerima Tambahan**: Jika > 1 penerima, Penerima 2-6 dalam 3 kolom di bawah
- [ ] **Text "PEMBERI KUASA"**: Hanya muncul 1x, bukan di loop
- [ ] **Page Breaks**: Scroll preview - ada margin yang cukup saat page break
- [ ] **PDF Download**: Multi-page dengan margin yang tepat antar halaman
- [ ] **Print Preview**: Ctrl+P - tidak ada text terputus, page breaks rapi

## Comparison: Sebelum vs Sesudah

| Aspek | Sebelum | Sesudah |
|-------|---------|---------|
| TTD Layout | Penerima atas, Pemberi bawah | Penerima I & Pemberi sejajar |
| PEMBERI KUASA Text | Loop (muncul 6x) | 1x saja |
| Penerima Extra | Vertical list | Grid 3 kolom |
| Page Break Gap | 2rem | 3rem |
| Table Break | Bisa terputus | `break-inside: avoid` |
| Text Width | Min 3 lines/page | Orphans: 3, Widows: 3 |

## Troubleshooting

**TTD tidak sejajar?**
→ Clear browser cache (Ctrl+Shift+Delete) atau reload hard (Ctrl+Shift+R)

**Page break masih terputus?**
→ Pastikan `column-width: 595px` aktif di `.preview-content`

**Text PEMBERI KUASA masih loop?**
→ Pastikan hanya ada 1 `<p>Selanjutnya dalam surat kuasa ini disebut sebagai PENERIMA KUASA</p>` sebelum loop penerima

**Margin tidak cukup?**
→ Tingkatkan `column-gap` di CSS atau tambah `margin-bottom` di `.surat-section`
