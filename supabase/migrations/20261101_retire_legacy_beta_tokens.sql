-- New beta identities only use Supabase Auth. Existing 17 old beta records
-- remain intact for a possible controlled recovery; anonymous legacy registration
-- and raw bearer-token RPC endpoints are no longer publicly callable.
revoke execute on function public.sfb_api(text,text,jsonb) from public,anon,authenticated;
revoke execute on function public.sfb_save_api(text,text,jsonb) from public,anon,authenticated;
-- Auth-linked RPC runs as the function owner and may call legacy core internally.
grant execute on function public.sfb_account_api(text,jsonb) to authenticated;
