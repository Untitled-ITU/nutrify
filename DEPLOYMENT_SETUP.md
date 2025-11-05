# Cloud Run Deployment Setup Guide

Bu doküman, Nutrify backend'inin Google Cloud Run'a deploy edilmesi için gerekli adımları içerir.

## 📋 Ön Gereksinimler

1. Google Cloud Platform (GCP) hesabı
2. Firebase projesi (zaten mevcut: `untitled-nutrify-preprod`)
3. GitHub repository'ye erişim

## 🔧 Adım Adım Kurulum

### 1. Google Cloud Project'i Aktifleştirin

```bash
# GCP Console'da projenizi seçin veya yeni bir proje oluşturun
# Firebase projenizle aynı projeyi kullanın: untitled-nutrify-preprod
```

### 2. Gerekli API'leri Aktifleştirin

Google Cloud Console'da şu API'leri aktifleştirin:
- Cloud Run API
- Container Registry API (veya Artifact Registry API)
- Cloud Build API

```bash
# veya gcloud CLI ile:
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

### 3. Service Account Oluşturun

```bash
# Service account oluştur
gcloud iam service-accounts create github-actions \
    --display-name="GitHub Actions Service Account"

# Gerekli roller
gcloud projects add-iam-policy-binding untitled-nutrify-preprod \
    --member="serviceAccount:github-actions@untitled-nutrify-preprod.iam.gserviceaccount.com" \
    --role="roles/run.admin"

gcloud projects add-iam-policy-binding untitled-nutrify-preprod \
    --member="serviceAccount:github-actions@untitled-nutrify-preprod.iam.gserviceaccount.com" \
    --role="roles/storage.admin"

gcloud projects add-iam-policy-binding untitled-nutrify-preprod \
    --member="serviceAccount:github-actions@untitled-nutrify-preprod.iam.gserviceaccount.com" \
    --role="roles/iam.serviceAccountUser"

# Service account key oluştur
gcloud iam service-accounts keys create key.json \
    --iam-account=github-actions@untitled-nutrify-preprod.iam.gserviceaccount.com
```

### 4. GitHub Secrets Ekleme

GitHub repository'nizde Settings > Secrets and variables > Actions'a gidin ve şu secret'ları ekleyin:

1. **GCP_PROJECT_ID**: `untitled-nutrify-preprod`
2. **GCP_SA_KEY**: `key.json` dosyasının içeriğini (tam JSON olarak) ekleyin
3. **JWT_SECRET_KEY**: Güvenli bir JWT secret key (örn: `openssl rand -hex 32` ile oluşturabilirsiniz)

### 5. İlk Deploy

`develop` branch'ine push yaptığınızda otomatik olarak deploy başlayacak:

```bash
git add .
git commit -m "Add Cloud Run deployment configuration"
git push origin develop
```

GitHub Actions sekmesinden deploy işlemini takip edebilirsiniz.

### 6. Cloud Run URL'ini Alın

Deploy tamamlandıktan sonra Cloud Run URL'i şu şekilde olacak:
```
https://nutrify-backend-xxxxx-ew.a.run.app
```

Bu URL'i not edin, frontend'den backend'e istek yaparken kullanacaksınız.

### 7. Frontend'de Backend URL'ini Yapılandırın

Frontend kodunuzda backend API çağrıları için Cloud Run URL'ini kullanın. Örneğin:

```typescript
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://nutrify-backend-xxxxx-ew.a.run.app';
```

## 🔍 Deploy Sonrası Kontroller

1. Cloud Run servisinin çalıştığını kontrol edin:
   ```bash
   gcloud run services list --region=europe-west1
   ```

2. Backend API'yi test edin:
   ```bash
   curl https://nutrify-backend-xxxxx-ew.a.run.app/api/auth/login
   ```

3. Logları kontrol edin:
   ```bash
   gcloud run services logs read nutrify-backend --region=europe-west1
   ```

## 🐛 Sorun Giderme

### Build hatası alıyorsanız:
- `backend/requirements.txt` dosyasının doğru olduğundan emin olun
- Dockerfile'ın `backend/` klasöründe olduğunu kontrol edin

### Deploy hatası alıyorsanız:
- GitHub Secrets'ların doğru eklendiğinden emin olun
- Service account'un gerekli rollerle donatıldığını kontrol edin
- GCP Console'da API'lerin aktif olduğunu doğrulayın

### CORS hatası alıyorsanız:
- `backend/app.py` dosyasında CORS yapılandırmasının olduğundan emin olun
- Frontend URL'ini CORS origins'e ekleyin (gerekirse)

## 📝 Notlar

- Cloud Run servisi otomatik olarak scale edilir (0'dan 10 instance'a kadar)
- İlk istek biraz yavaş olabilir (cold start)
- Environment variables Cloud Run deploy sırasında set edilir
- JWT_SECRET_KEY production'da mutlaka güvenli bir değer olmalı

