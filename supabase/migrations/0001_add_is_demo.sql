-- 0001 — is_demo bayrağı: demo/seed verisini gerçek (canlı) veriden ayırır.
-- Dashboard toggle'ı bu kolonla çalışır; reset script'i sadece is_demo=true siler.
-- Idempotent: tekrar çalıştırılması güvenli.

alter table merchants    add column if not exists is_demo boolean not null default false;
alter table transactions add column if not exists is_demo boolean not null default false;

create index if not exists idx_transactions_is_demo on transactions (is_demo);
