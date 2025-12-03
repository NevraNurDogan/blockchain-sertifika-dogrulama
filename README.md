#  Blockchain Tabanlı Sertifika Doğrulama Sistemi

> **Ders:** 1229748 – Dijital Dönüşüme Giriş  
> **Kurum:** Konya Teknik Üniversitesi  
> **Bölüm:** Yazılım Mühendisliğiliği
---
## Proje Özeti
Bu proje, Docker üzerinde çalışan mikroservis mimarisine sahip bir blokzincir uygulamasıdır. Kurumların dijital sertifikaları güvenli, değiştirilemez ve şeffaf bir şekilde oluşturmasını, iptal etmesini ve üçüncü taraflarca doğrulanmasını sağlar.

Sistem, KVKK (Kişisel Verilerin Korunması Kanunu) prensiplerine uygun olarak tasarlanmış olup, kişisel verileri (TC, İsim vb.) blokzincire yazmaz. Bunun yerine, verilerin kriptografik özetlerini (Hash) ve "Salt" (Tuzlama) tekniğini kullanarak gizliliği sağlar.
---

## Mimari ve Teknolojiler

Proje, Docker Compose ile yönetilen 3 ana konteynerden oluşur:
1. **Chain (Ganache): Yerel Ethereum blokzincir ağı (certnet üzerinde çalışır).
2. **Hardhat (Smart Contract): Solidity kontratlarının derlenmesi, test edilmesi ve ağa dağıtılması (Deploy) işlemlerini yürütür.
3. **Client (Frontend): React ve Vite tabanlı kullanıcı arayüzü. Sertifika oluşturma ve doğrulama işlemlerini yapar.

## Kullanılan Teknolojiler:

Dil: Solidity (v0.8.20), JavaScript (React, Node.js)
Altyapı: Docker, Docker Compose
Framework: Hardhat, Vite, Ethers.js
Güvenlik: OpenZeppelin AccessControl, Keccak256 Hashing

## Kurulum ve Çalıştırma
Projeyi yerel makinenizde çalıştırmak için aşağıdaki adımları izleyin.

### Ön Gereksinimler
* Docker Desktop (Çalışır durumda olmalı)
* Node.js (LTS sürümü önerilir)
* Git

**Adım 1: Projeyi Klonlayın ve Hazırlayın**

``` Bash
-------------------------------------------------------------------------------------------------------------------------|
git clone [https://github.com/kullanici_adiniz/blockchain-sertifika-dogrulama.git](https://github.com/kullanici_adiniz/ blockchain-sertifika-dogrulama.git)                                                                                      |
                                                                                                                         |    
cd blockchain-sertifika-dogrulama                                                                                        |
                                                                                                                         |
-------------------------------------------------------------------------------------------------------------------------|
```
**Adım 2: Docker Ortamını Başlatın**
Tüm servisleri (Blockchain, Backend, Frontend) tek komutla ayağa kaldırın:

```Bash
-----------------------------------
docker-compose up -d --build       | 
-----------------------------------
```
Bu işlem Ganache ağını başlatacak ve gerekli bağımlılıkları yükleyecektir.

**Adım 3: Akıllı Kontratı Deploy Edin**
Kontratı yerel Ganache ağına yüklemek için dapp klasörüne gidin ve deploy scriptini çalıştırın:

```Bash
----------------------------------------------------------------------
cd dapp                                                              | 
npm install                                                          | 
npx hardhat run scripts/deploy.js --network localhost                |
----------------------------------------------------------------------
```
 ÖNEMLİ: Bu komutun çıktısında CertificateRegistry deployed to: 0x... şeklinde bir adres göreceksiniz. Bu adresi kopyalayın.

**Adım 4: Frontend Yapılandırması**
client/src/App.jsx dosyasını açın.

CONTRACT_ADDRESS değişkenini kopyaladığınız yeni adres ile güncelleyin:

JavaScript

const CONTRACT_ADDRESS = "0x.....(Kopyaladığınız Adres).....";

**Adım 5: Uygulamayı**
Tarayıcınızda şu adrese gidin: http://localhost:5173

 Test Süreçleri
Akıllı kontratın güvenliğini ve iş mantığını doğrulamak için yazılmış birim testlerini (Unit Tests) çalıştırmak için:

```Bash
-----------------------------------
cd dapp                            | 
npx hardhat test                   | 
-----------------------------------
```
Test Kapsamı:

✅ Yetkili (Issuer) sertifika oluşturabilir mi?

✅ Yetkisiz kullanıcı işlem yapmaya çalıştığında engelleniyor mu (AccessControl)?

✅ Sertifika doğrulama (Verify) doğru çalışıyor mu?

✅ İptal etme (Revoke) işlemi sonrası sertifika geçersiz oluyor mu?

## Veri Gizliliği ve Güvenlik (KVKK)
Bu proje, kişisel verilerin korunması için özel bir mimari kullanır:

Off-Chain Storage: Öğrenci ismi, TC kimlik no gibi hassas veriler blokzincirde saklanmaz.

Hashing: Veriler SHA-256 (Keccak256) algoritması ile özetlenir.

Salting (Tuzlama): Sözlük saldırılarını (Dictionary Attacks) önlemek için her sertifikaya özel rastgele üretilmiş bir Salt (Tuz) değeri eklenir.

Doğrulama:

Zincire yazılan veri: Hash(TC + İsim + Salt)

Doğrulama anında kullanıcı TC, İsim ve Salt değerini girer. İstemci (Frontend) bu verilerin hash'ini tekrar hesaplar ve zincirdeki hash ile eşleşip eşleşmediğini kontrol eder.

🖥️ Kullanım Senaryoları
1. Sertifika Oluşturma (Issue)
Yönetici panelinden ID, TC, İsim ve Başlık girilir.

"Rastgele Üret" butonu ile güvenli bir Salt oluşturulur.

"Sertifikayı Oluştur" butonuna basılır ve işlem blokzincire yazılır.

2. Sertifika Doğrulama (Verify)
Herhangi bir kullanıcı, sertifika sahibinden aldığı ID ve Salt değerini girer.

"Sorgula" butonuna basıldığında sistem hash kontrolü yapar.

Sonuç olarak sertifikanın Geçerli, Geçersiz veya İptal Edilmiş olduğu gösterilir.

3. Sertifika İptali (Revoke)
Hatalı oluşturulan bir sertifika, ID girilerek "İPTAL ET" butonu ile geçersiz kılınabilir.

 Proje Yapısı
.
├── docker-compose.yml      # Konteyner orkestrasyon dosyası
├── dapp/                   # Backend / Smart Contract
│   ├── contracts/          # Solidity kodları (CertificateRegistry.sol)
│   ├── scripts/            # Deploy scriptleri
│   ├── test/               # Test dosyaları
│   └── hardhat.config.js   # Hardhat ayarları
└── client/                 # Frontend / React Arayüzü
    ├── src/
    │   ├── App.jsx         # Ana uygulama ve mantık
    │   └── ...
    └── vite.config.js      # Vite ayarları
👥 Ekip ve Lisans
Bu proje Konya Teknik Üniversitesi Yazılım Mühendisliği bölümü ödevi kapsamında hazırlanmıştır.

Lisans: MIT
 ```  
 
 