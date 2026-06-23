-- 0002 — allowed_domains: her merchant'ın widget'ı çalıştırabileceği origin host'ları.
-- Örn. {bitaksi.com, www.bitaksi.com}. /api/transactions POST'unda istek Origin/Referer
-- host'u bu listede değilse 403 döner ve kayıt YAPILMAZ.
-- Boş array ('{}') = henüz ayarlanmamış (yeni merchant) → API isteği is_demo=true
-- olarak kabul eder (gerçek geliri kirletmez). Idempotent.

alter table merchants add column if not exists allowed_domains text[] not null default '{}';

-- Demo merchant'ları localhost'tan çalışabilsin (CEO demo / yerel test).
update merchants set allowed_domains = '{localhost,127.0.0.1}'
  where merchant_id in ('BITAKSIDEMO') and allowed_domains = '{}';
