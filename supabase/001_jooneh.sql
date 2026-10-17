-- Run once in the intended Supabase project as the database administrator.
-- No account passwords, service keys, personal profiles or diary data belong here.
begin;
create schema if not exists jooneh_private;
revoke all on schema jooneh_private from public, anon, authenticated;
create table jooneh_private.members (user_id uuid primary key references auth.users(id) on delete cascade);
alter table jooneh_private.members enable row level security;
create policy own_membership on jooneh_private.members for select to authenticated using ((select auth.uid())=user_id);
create table jooneh_private.journals (
 user_id uuid primary key references auth.users(id) on delete cascade,
 revision bigint not null default 0,
 mutation_id uuid,
 updated_at timestamptz not null default now()
);
create table jooneh_private.records (
 user_id uuid not null references auth.users(id) on delete cascade,
 record_key text not null,
 value jsonb not null,
 revision bigint not null,
 primary key(user_id,record_key)
);
create table jooneh_private.history (
 user_id uuid not null references auth.users(id) on delete cascade,
 record_key text not null,
 revision bigint not null,
 value jsonb,
 updated_at timestamptz not null default now(),
 primary key(user_id,record_key,revision)
);
create index history_user_revision on jooneh_private.history(user_id,revision desc);
alter table jooneh_private.journals enable row level security;
alter table jooneh_private.records enable row level security;
alter table jooneh_private.history enable row level security;
-- Defense in depth; tables are in an unexposed schema and have no client grants.
create policy own_journal on jooneh_private.journals for select to authenticated using ((select auth.uid())=user_id);
create policy own_records on jooneh_private.records for select to authenticated using ((select auth.uid())=user_id);
create policy own_history on jooneh_private.history for select to authenticated using ((select auth.uid())=user_id);
revoke all on all tables in schema jooneh_private from public,anon,authenticated;

create function jooneh_private.assemble(p_rows jsonb) returns jsonb language plpgsql immutable set search_path='' as $$
declare result jsonb:='{"version":1,"days":{},"foods":[],"favorites":[],"goals":{},"profile":{}}'; item jsonb;
begin
 for item in select value from jsonb_array_elements(coalesce(p_rows,'[]'::jsonb)) loop
  if item->'value' is null or item->'value'='null'::jsonb then continue; end if;
  if item->>'record_key'='meta' then result:=result||(item->'value');
  else result:=jsonb_set(result,array['days',substr(item->>'record_key',5)],item->'value',true);end if;
 end loop;
 return result;
end $$;

create function jooneh_private.jooneh_read() returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); j jooneh_private.journals; rows jsonb;
begin
 if uid is null or not exists(select 1 from jooneh_private.members where user_id=uid) then raise exception 'Authorized account required' using errcode='42501';end if;
 -- Lock against concurrent writes so revision and records form one snapshot.
 select * into j from jooneh_private.journals where user_id=uid for share;
 if not found then return jsonb_build_object('state',null,'revision',0);end if;
 select jsonb_agg(jsonb_build_object('record_key',record_key,'value',value)) into rows from jooneh_private.records where user_id=uid;
 return jsonb_build_object('state',jooneh_private.assemble(rows),'revision',j.revision,'updatedAt',j.updated_at);
end $$;

create function jooneh_private.jooneh_write(p_revision bigint,p_mutation uuid,p_changes jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); j jooneh_private.journals; c jsonb; k text; v jsonb; next_rev bigint; n integer; seen text[]:='{}';
begin
 if uid is null or not exists(select 1 from jooneh_private.members where user_id=uid) then raise exception 'Authorized account required' using errcode='42501';end if;
 if p_revision is null or p_revision<0 or p_mutation is null or jsonb_typeof(p_changes) is distinct from 'array' then raise exception 'Invalid input' using errcode='22023';end if;
 n:=jsonb_array_length(p_changes);
 if n<1 or n>200 or octet_length(p_changes::text)>8000000 then raise exception 'Invalid input size' using errcode='22023';end if;
 for c in select value from jsonb_array_elements(p_changes) loop
  k:=c->>'key';v:=c->'value';
  if k is null or v is null or k=any(seen) or octet_length(v::text)>750000 then raise exception 'Invalid record' using errcode='22023';end if;
  seen:=array_append(seen,k);
  if k='meta' then
   if jsonb_typeof(v) is distinct from 'object' or v->>'version' is distinct from '1' or (v-array['version','foods','favorites','goals','profile'])<>'{}'::jsonb or jsonb_typeof(v->'foods') is distinct from 'array' or jsonb_typeof(v->'favorites') is distinct from 'array' or jsonb_typeof(v->'goals') is distinct from 'object' or jsonb_typeof(v->'profile') is distinct from 'object' then raise exception 'Invalid metadata' using errcode='22023';end if;
  elsif k ~ '^day:[0-9]{4}-[0-9]{2}-[0-9]{2}$' then
   begin perform substr(k,5)::date;exception when others then raise exception 'Invalid date' using errcode='22023';end;
   if v<>'null'::jsonb and (jsonb_typeof(v) is distinct from 'object' or jsonb_typeof(v->'entries') is distinct from 'array' or jsonb_typeof(v->'habits') is distinct from 'array') then raise exception 'Invalid day' using errcode='22023';end if;
  else raise exception 'Invalid record key' using errcode='22023';end if;
 end loop;
 insert into jooneh_private.journals(user_id) values(uid) on conflict(user_id) do nothing;
 select * into j from jooneh_private.journals where user_id=uid for update;
 if j.mutation_id=p_mutation then return jsonb_build_object('revision',j.revision);end if;
 if j.revision<>p_revision then return jsonb_build_object('error','conflict','revision',j.revision);end if;
 next_rev:=j.revision+1;
 for c in select value from jsonb_array_elements(p_changes) loop
  k:=c->>'key';v:=c->'value';
  if v='null'::jsonb then delete from jooneh_private.records where user_id=uid and record_key=k;
  else insert into jooneh_private.records(user_id,record_key,value,revision) values(uid,k,v,next_rev) on conflict(user_id,record_key) do update set value=excluded.value,revision=excluded.revision;end if;
  insert into jooneh_private.history(user_id,record_key,value,revision) values(uid,k,v,next_rev);
 end loop;
 update jooneh_private.journals set revision=next_rev,mutation_id=p_mutation,updated_at=now() where user_id=uid;
 return jsonb_build_object('revision',next_rev,'updatedAt',now());
end $$;

create function jooneh_private.jooneh_history() returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); result jsonb;
begin
 if uid is null or not exists(select 1 from jooneh_private.members where user_id=uid) then raise exception 'Authorized account required' using errcode='42501';end if;
 select coalesce(jsonb_agg(to_jsonb(t)),'[]'::jsonb) into result from (select revision,max(updated_at) as updated_at,count(*) as changed_records from jooneh_private.history where user_id=uid group by revision order by revision desc limit 30) t;
 return result;
end $$;
create function jooneh_private.jooneh_read_version(p_revision bigint) returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); rows jsonb;
begin
 if uid is null or not exists(select 1 from jooneh_private.members where user_id=uid) then raise exception 'Authorized account required' using errcode='42501';end if;
 if p_revision is null or p_revision<1 then raise exception 'Invalid version' using errcode='22023';end if;
 select jsonb_agg(jsonb_build_object('record_key',record_key,'value',value)) into rows from (select distinct on (record_key) record_key,value from jooneh_private.history where user_id=uid and revision<=p_revision order by record_key,revision desc) t;
 if rows is null then raise exception 'Version not found' using errcode='22023';end if;
 return jsonb_build_object('state',jooneh_private.assemble(rows),'revision',p_revision);
end $$;
revoke all on all functions in schema jooneh_private from public,anon,authenticated;
grant usage on schema jooneh_private to authenticated;
grant execute on function jooneh_private.jooneh_read() to authenticated;
grant execute on function jooneh_private.jooneh_write(bigint,uuid,jsonb) to authenticated;
grant execute on function jooneh_private.jooneh_history() to authenticated;
grant execute on function jooneh_private.jooneh_read_version(bigint) to authenticated;
create function public.jooneh_read() returns jsonb language sql security invoker set search_path='' as $$ select jooneh_private.jooneh_read() $$;
create function public.jooneh_write(p_revision bigint,p_mutation uuid,p_changes jsonb) returns jsonb language sql security invoker set search_path='' as $$ select jooneh_private.jooneh_write(p_revision,p_mutation,p_changes) $$;
create function public.jooneh_history() returns jsonb language sql security invoker set search_path='' as $$ select jooneh_private.jooneh_history() $$;
create function public.jooneh_read_version(p_revision bigint) returns jsonb language sql security invoker set search_path='' as $$ select jooneh_private.jooneh_read_version(p_revision) $$;
revoke all on function public.jooneh_read() from public,anon,authenticated;
revoke all on function public.jooneh_write(bigint,uuid,jsonb) from public,anon,authenticated;
revoke all on function public.jooneh_history() from public,anon,authenticated;
revoke all on function public.jooneh_read_version(bigint) from public,anon,authenticated;
grant execute on function public.jooneh_read() to authenticated;
grant execute on function public.jooneh_write(bigint,uuid,jsonb) to authenticated;
grant execute on function public.jooneh_history() to authenticated;
grant execute on function public.jooneh_read_version(bigint) to authenticated;
commit;
