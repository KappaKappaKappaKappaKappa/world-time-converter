CREATE TABLE meetings (
  id           SERIAL PRIMARY KEY,
  title        TEXT NOT NULL,
  organizer    TEXT NOT NULL,
  city         TEXT NOT NULL,
  timezone     TEXT NOT NULL,
  starts_at    TIMESTAMPTZ NOT NULL,
  duration_min INT NOT NULL DEFAULT 60
);

INSERT INTO meetings (title, organizer, city, timezone, starts_at, duration_min) VALUES
 ('Квартальный отчёт',          'Анна Лейн',      'Лондон',   'Europe/London',    '2026-10-20 09:00+01', 60),
 ('Синхронизация продуктовых команд','Кендзи Танака',  'Токио',    'Asia/Tokyo',       '2026-10-21 10:00+09', 45),
 ('Планирование релиза',             'Майк Джонсон',   'Нью-Йорк', 'America/New_York', '2026-10-22 14:00-04', 90),
 ('Встреча с партнёрами',            'Прия Шарма',     'Дубай',    'Asia/Dubai',       '2026-10-23 11:30+04', 60),
 ('Ретроспектива спринта',           'Лукас Мартин',   'Сидней',   'Australia/Sydney', '2026-10-24 16:00+11', 30),
 ('Бюджет на 2027 год',              'Ольга Смирнова', 'Москва',   'Europe/Moscow',    '2026-10-26 12:00+03', 120);