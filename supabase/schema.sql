create extension if not exists "pgcrypto";

create table if not exists cases (
  id uuid primary key default gen_random_uuid(),
  case_name text not null,
  defendant text not null,
  plaintiff text not null,
  district text not null,
  date_filed date not null,
  case_number text not null unique,
  case_url text not null,
  industry text not null check (
    industry in (
      'Retail',
      'Real Estate',
      'Ecommerce',
      'Healthcare',
      'Education',
      'Hospitality',
      'Financial',
      'Technology',
      'Travel',
      'Other'
    )
  ),
  created_at timestamp default now()
);

create index if not exists cases_date_filed_idx on cases (date_filed desc);
create index if not exists cases_district_idx on cases (district);
create index if not exists cases_industry_idx on cases (industry);

create or replace function top_plaintiffs()
returns table(label text, count bigint)
language sql
stable
as $$
  select plaintiff as label, count(*) as count
  from cases
  group by plaintiff
  order by count(*) desc
  limit 10;
$$;

create or replace function top_districts()
returns table(label text, count bigint)
language sql
stable
as $$
  select district as label, count(*) as count
  from cases
  group by district
  order by count(*) desc;
$$;

create or replace function industry_distribution()
returns table(label text, count bigint)
language sql
stable
as $$
  select industry as label, count(*) as count
  from cases
  where industry <> 'Other'
  group by industry
  order by count(*) desc;
$$;
