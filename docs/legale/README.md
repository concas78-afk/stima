# 📁 Pacchetto Legale QuickCraft CRM

> ⚠️ **DISCLAIMER IMPORTANTE:** questi documenti sono **bozze/template** redatte a scopo
> dimostrativo e di avvio. **Non sostituiscono la consulenza di un professionista legale.**
> Prima di andare in produzione, fai revisionare ogni documento da un avvocato o da un
> consulente privacy qualificato, e adattali alla struttura societaria effettiva.

## Documenti inclusi

| File | A cosa serve |
|---|---|
| `DPA_QuickCraft_Artigiano.md` | Contratto Responsabile del Trattamento (art. 28 GDPR) tra QuickCraft e l'artigiano |
| `Privacy_Policy_QuickCraft.md` | Informativa privacy di QuickCraft (noi Titolari) verso gli utenti artigiani |
| `Informativa_Cliente_Finale.md` | Template informativa che l'artigiano consegna ai propri clienti |
| `Registro_Trattamenti.md` | Registro delle attività di trattamento (art. 30 GDPR) |
| `Onboarding_Fatturazione.md` | Testo del consenso/onboarding da far accettare prima di attivare la fatturazione |

## Ordine di utilizzo consigliato

1. **Prima di attivare la fatturazione**, l'artigiano accetta `Onboarding_Fatturazione.md`.
2. QuickCraft firma il `DPA_QuickCraft_Artigiano.md` con ogni artigiano.
3. QuickCraft stipula un DPA con il **provider API di fatturazione** (sub-responsabile).
4. L'artigiano consegna ai suoi clienti `Informativa_Cliente_Finale.md`.
5. QuickCraft tiene aggiornato il `Registro_Trattamenti.md`.

## Catena dei ruoli (dal parere del DPO)

```
Artigiano (Titolare)
   └─ Claudio Concas (Responsabile art. 28)
        └─ Provider API F.E. (Sub-responsabile art. 28 c.4)
             └─ Conservatore a norma (ulteriore sub-responsabile)
Agenzia delle Entrate / SDI → Titolare autonomo ex lege (nessun DPA)
```
