# Implementation Plan

- [ ] 1. Fix SubscriptionContext — add telegram_username, polling, and congratulations state
  - [ ] 1.1 Add `telegram_username` to `SubscriptionDetails` interface
  - [ ] 1.2 Add AppState listener to re-fetch subscription status when app comes to foreground
  - [ ] 1.3 Add `previousStatus` tracking to detect active/reactivation transitions
  - [ ] 1.4 Expose `showCongrats` and `dismissCongrats` from context

- [ ] 2. Fix subscription-packages.tsx — remove duplicate fetch, add transaction ref
  - [ ] 2.1 Remove independent API fetch and local duplicate state
  - [ ] 2.2 Consume SubscriptionContext exclusively
  - [ ] 2.3 Add getOrCreateTransactionRef helper using storage
  - [ ] 2.4 Update buildTelegramPaymentLink to include transaction ref
  - [ ] 2.5 Update handlePackageSelect to be async and use transaction ref

- [ ] 3. Fix FeatureGuard.tsx — fix t() arity error

- [ ] 4. Add congratulations modal to SubscriptionGuard
