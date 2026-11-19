# Build APK / AAB

## Comandi

```powershell
# 1. Build web + sync verso Android
npm.cmd run build
npx.cmd cap sync android

# 2. Build APK (debug) + AAB (release firmato)
cd android
$env:JAVA_HOME = "C:\Users\claudio\.jdks\jdk-21.0.12.1+1"
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
.\gradlew.bat --stop
.\gradlew.bat assembleDebug bundleRelease --no-daemon
```

> Usare `--no-daemon` per evitare i lock di OneDrive.
> Se compare `Unable to delete` / `Cannot snapshot`, fermare il daemon e cancellare `android/app/build/intermediates/incremental/packageDebug` e `packageRelease`.

## Output

- APK debug: `android/app/build/outputs/apk/debug/app-debug.apk`
- AAB release: `android/app/build/outputs/bundle/release/app-release.aab`

## Destinazioni di copia (convenzione del progetto)

- **APK di test** → `G:\Il mio Drive\Stima - Test\Stima-test.apk`
- **AAB per Play Store** → `C:\Users\claudio\OneDrive - Polizia di Stato\Desktop\Stima - File Play Store\Stima-<versione>.aab`
- Feature graphic / icona Play → stessa cartella "Stima - File Play Store"

## Versione

Aggiornare `android/app/build.gradle`:
- `versionCode` (+1 a ogni upload su Play)
- `versionName` (es. "1.0.6")
